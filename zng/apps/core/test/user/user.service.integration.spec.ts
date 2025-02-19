import { Test, TestingModule } from '@nestjs/testing';
import { v4 as uuidv4 } from 'uuid';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { memoryDataSourceForTests } from '../postgress-memory-datasource';
import { UserCreateRequestDto, UserUpdateRequestDto } from '../../src/dto';
import { UsersModule } from '../../src/users/users.module';
import { UsersService } from '../../src/users/users.service';
import phone from 'phone';
import { IBackup } from 'pg-mem';
import { MultiValueOperator, SingleValueOperator } from '@library/shared/common/search';

describe('UsersService Integration Tests', () => {
  let module: TestingModule;
  let service: UsersService;
  let databaseBackup: IBackup;

  beforeAll(async () => {
    const memoryDBinstance = await memoryDataSourceForTests();
    const { dataSource, database } = memoryDBinstance;
    initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

    module = await Test.createTestingModule({ imports: [UsersModule] })
      .overrideProvider(DataSource)
      .useValue(addTransactionalDataSource(dataSource))
      .compile();

    service = module.get<UsersService>(UsersService);
    databaseBackup = database.backup();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    databaseBackup.restore();
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      // Simulate controller-level behaviour for phone number normalization
      const phoneNumber = '+12124567890';
      const normalizedPhoneNumber = phone(phoneNumber, { country: 'USA' });

      const mockUser: UserCreateRequestDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber,
        normalizedPhoneNumber: normalizedPhoneNumber.phoneNumber,
      };

      const createResult = await service.createUser(mockUser);

      const result = await service.getUserById(createResult.id);
      expect(result).toEqual({
        id: createResult.id,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email,
        phoneNumber: mockUser.phoneNumber,
      });
    });

    it('should return null if user not found', async () => {
      const result = await service.getUserById(uuidv4());
      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return a user by email', async () => {
      // Simulate controller-level behaviour for phone number normalization
      const phoneNumber = '+12124567890';
      const normalizedPhoneNumber = phone(phoneNumber, { country: 'USA' });

      const mockUser: UserCreateRequestDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doez@example.com',
        phoneNumber: '1234567890',
        normalizedPhoneNumber: normalizedPhoneNumber.phoneNumber,
      };

      const createResult = await service.createUser(mockUser);

      const result = await service.getUserByEmail(createResult.email);
      expect(result).toEqual({
        id: createResult.id,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email,
        phoneNumber: mockUser.phoneNumber,
      });
    });

    it('should return null if user not found', async () => {
      const result = await service.getUserByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('getUserByPhoneNumber', () => {
    it('should return a user by phone number', async () => {
      // Simulate controller-level behaviour for phone number normalization
      const phoneNumber = '+12124567890';
      const normalizedPhoneNumber = phone(phoneNumber, { country: 'USA' });

      const mockUser: UserCreateRequestDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doep@example.com',
        phoneNumber: '1234567800',
        normalizedPhoneNumber: normalizedPhoneNumber.phoneNumber,
      };

      const createResult = await service.createUser(mockUser);

      const result = await service.getUserByPhoneNumber(createResult.phoneNumber);
      expect(result).toEqual({
        id: createResult.id,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email,
        phoneNumber: mockUser.phoneNumber,
      });
    });

    it('should return null if user not found', async () => {
      const result = await service.getUserByPhoneNumber('0000000000');
      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      // Simulate controller-level behaviour for phone number normalization
      const phoneNumber = '+12124567890';
      const normalizedPhoneNumber = phone(phoneNumber, { country: 'USA' });

      const createUserDto: UserCreateRequestDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doex@example.com',
        phoneNumber,
        normalizedPhoneNumber: normalizedPhoneNumber.phoneNumber,
      };

      const result = await service.createUser(createUserDto);
      expect(result).toEqual({
        id: expect.any(String),
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        email: createUserDto.email,
        phoneNumber: createUserDto.phoneNumber,
      });

      const createdUser = await service.getUserById(result.id);
      expect(createdUser).toEqual({
        id: result.id,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        email: createUserDto.email,
        phoneNumber: createUserDto.phoneNumber,
      });
    });

    it('should return null if user creation fails', async () => {
      jest.spyOn(service, 'createUser').mockResolvedValueOnce(null);

      const createUserDto: UserCreateRequestDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '1234567890',
      };

      const result = await service.createUser(createUserDto);
      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      // Simulate controller-level behaviour for phone number normalization
      const phoneNumber = '+12124567891';
      const normalizedPhoneNumber = phone(phoneNumber, { country: 'USA' });

      const mockUser: UserCreateRequestDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber,
        normalizedPhoneNumber: normalizedPhoneNumber.phoneNumber,
      };

      const creationResult = await service.createUser(mockUser);

      const updateUserDto: UserUpdateRequestDto = {
        id: creationResult.id,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phoneNumber: creationResult.phoneNumber,
        normalizedPhoneNumber: normalizedPhoneNumber.phoneNumber,
      };

      const result = await service.updateUser(updateUserDto);
      expect(result).toBe(true);

      const updatedUser = await service.getUserById(creationResult.id);
      expect(updatedUser).toEqual({
        id: creationResult.id,
        firstName: updateUserDto.firstName,
        lastName: updateUserDto.lastName,
        email: updateUserDto.email,
        phoneNumber: updateUserDto.phoneNumber,
      });
    });

    it('should return false if user update fails', async () => {
      const updateUserDto: UserUpdateRequestDto = {
        id: uuidv4(),
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phoneNumber: '+12124567891',
      };

      const result = await service.updateUser(updateUserDto);
      expect(result).toBe(false);
    });
  });

  describe('partialUpdateUser', () => {
    it('should partially update a user ignoring undefined fields', async () => {
      // Simulate controller-level behaviour for phone number normalization
      const phoneNumber = '+12124567891';
      const normalizedPhoneNumber = phone(phoneNumber, { country: 'USA' });

      const mockUser: UserCreateRequestDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber,
        normalizedPhoneNumber: normalizedPhoneNumber.phoneNumber,
      };

      const creationResult = await service.createUser(mockUser);

      const updateUserDto: UserUpdateRequestDto = {
        id: creationResult.id,
        firstName: 'Jane',
        lastName: undefined,
        email: undefined,
        phoneNumber: undefined,
        normalizedPhoneNumber: undefined,
      };

      const result = await service.updateUser(updateUserDto);
      expect(result).toBe(true);

      const updatedUser = await service.getUserById(creationResult.id);
      expect(updatedUser).toEqual({
        id: creationResult.id,
        firstName: updateUserDto.firstName,
        lastName: creationResult.lastName,
        email: creationResult.email,
        phoneNumber: creationResult.phoneNumber,
      });
    });

    // This case shows current behavior of update method for TypeORM
    // Highlights:
    // - If a field is provided as undefined, it wont be updated (keeps prev value)
    // - !! If a field is provided as falsy value (e.g. empty string for string type), it will be updated to falsy value
    // - !!! TypeORM ignores the fact that indexed fields might be wiped to falsy values - we need protect data here
    it('wipes values if falsy ones provided for fields', async () => {
      // Simulate controller-level behaviour for phone number normalization
      const phoneNumber = '+12124567891';
      const normalizedPhoneNumber = phone(phoneNumber, { country: 'USA' });

      const mockUser: UserCreateRequestDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber,
        normalizedPhoneNumber: normalizedPhoneNumber.phoneNumber,
      };

      const creationResult = await service.createUser(mockUser);

      const updateUserDto: UserUpdateRequestDto = {
        id: creationResult.id,
        firstName: 'Jane',
        lastName: '',
        email: '',
        phoneNumber: undefined,
        normalizedPhoneNumber: undefined,
      };

      const result = await service.updateUser(updateUserDto);
      expect(result).toBe(true);

      const updatedUser = await service.getUserById(creationResult.id);
      expect(updatedUser).toEqual({
        id: creationResult.id,
        firstName: updateUserDto.firstName,
        lastName: '',
        email: '',
        phoneNumber: creationResult.phoneNumber,
      });
    });
  });

  describe('deleteUser', () => {
    it('should soft delete a user', async () => {
      // Simulate controller-level behaviour for phone number normalization
      const phoneNumber = '+12124567891';
      const normalizedPhoneNumber = phone(phoneNumber, { country: 'USA' });

      const mockUser: UserCreateRequestDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber,
        normalizedPhoneNumber: normalizedPhoneNumber.phoneNumber,
      };

      const creationResult = await service.createUser(mockUser);

      const deleteResult = await service.deleteUser(creationResult.id);
      expect(deleteResult).toBe(true);

      const deletedUser = await service.getUserById(creationResult.id);
      expect(deletedUser).toBeNull();
    });

    it('should return false if user deletion fails', async () => {
      const deleteResult = await service.deleteUser(uuidv4());
      expect(deleteResult).toBe(false);
    });
  });

  describe('restoreUser', () => {
    it('should restore a soft deleted user', async () => {
      // Simulate controller-level behaviour for phone number normalization
      const phoneNumber = '+12124567891';
      const normalizedPhoneNumber = phone(phoneNumber, { country: 'USA' });

      const mockUser: UserCreateRequestDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber,
        normalizedPhoneNumber: normalizedPhoneNumber.phoneNumber,
      };

      const creationResult = await service.createUser(mockUser);

      await service.deleteUser(creationResult.id);

      const restoreResult = await service.restoreUser(creationResult.id);
      expect(restoreResult).toBe(true);

      const restoredUser = await service.getUserById(creationResult.id);
      expect(restoredUser).toEqual({
        id: creationResult.id,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email,
        phoneNumber: mockUser.phoneNumber,
      });
    });

    it('should return false if user restoration fails', async () => {
      const restoreResult = await service.restoreUser(uuidv4());
      expect(restoreResult).toBe(false);
    });
  });

  describe('search', () => {
    it('should return users matching the search criteria', async () => {
      const users = [
        { firstName: 'Alice', lastName: 'Smith', email: 'alice.smith@example.com', phoneNumber: '+12124567890' },
        { firstName: 'Bob', lastName: 'Davis', email: 'bob.davis@example.com', phoneNumber: '+12124567891' },
        { firstName: 'Charlie', lastName: 'Davis', email: 'charlie.davis@example.com', phoneNumber: '+12124567892' },
        { firstName: 'David', lastName: 'Evans', email: 'david.evans@example.com', phoneNumber: '+12124567893' },
        { firstName: 'Eve', lastName: 'Foster', email: 'eve.foster@example.com', phoneNumber: '+12124567894' },
      ];

      for (const user of users) {
        const normalizedPhoneNumber = phone(user.phoneNumber, { country: 'USA' });
        await service.createUser({ ...user, normalizedPhoneNumber: normalizedPhoneNumber.phoneNumber });
      }

      // EQ
      const equalsFilters = [{ field: 'firstName', operator: SingleValueOperator.EQUALS, value: 'Alice' }];
      const equalsResult = await service.search(equalsFilters);

      expect(equalsResult).toHaveLength(1);
      expect(equalsResult[0].firstName).toBe('Alice');

      // ILIKE (Case-insensitive LIKE)
      const likeFilters = [{ field: 'email', operator: SingleValueOperator.LIKE, value: 'davis' }];
      const likeResult = await service.search(likeFilters);

      expect(likeResult).toHaveLength(2);
      expect(likeResult.map((r) => r.firstName)).toEqual(['Bob', 'Charlie']);

      // NOT EQ
      const notEqualsFilters = [
        { field: 'lastName', operator: SingleValueOperator.EQUALS, reverse: true, value: 'Davis' },
      ];
      const notEqualsResult = await service.search(notEqualsFilters);

      expect(notEqualsResult).toHaveLength(3);

      // MORE THAN EQ
      const moreThanFilters = [
        { field: 'phoneNumber', operator: SingleValueOperator.GREATER_THAN_OR_EQUAL, value: '+12124567892' },
      ];
      const moreThanResult = await service.search(moreThanFilters);

      expect(moreThanResult).toHaveLength(3);

      // IN
      const inFilters = [{ field: 'firstName', operator: SingleValueOperator.IN, value: ['Alice', 'Bob'] }];
      const inResult = await service.search(inFilters);

      expect(inResult).toHaveLength(2);

      // BETWEEN
      const betweenFilter = [
        { field: 'phoneNumber', operator: MultiValueOperator.BETWEEN, value: ['+12124567893', '+12124567894'] },
      ];
      const betweenResult = await service.search(betweenFilter);

      expect(betweenResult).toHaveLength(2);

      // EMPTY
      const emptyFilter = [{ field: 'deletedAt', operator: SingleValueOperator.EMPTY, value: null }];
      const emptyResult = await service.search(emptyFilter);

      expect(emptyResult).toHaveLength(5);
    });
  });
});
