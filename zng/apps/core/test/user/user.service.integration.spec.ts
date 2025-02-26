import { Test, TestingModule } from '@nestjs/testing';
import { v4 as uuidv4 } from 'uuid';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { memoryDataSourceForTests } from '../postgress-memory-datasource';
import { UserCreateRequestDto, UserUpdateRequestDto } from '../../src/dto';
import { UsersModule } from '../../src/users/users.module';
import { UsersService } from '../../src/users/users.service';
import { IBackup } from 'pg-mem';
import { ValueOperator } from '@library/shared/common/search';

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

      const mockUser: UserCreateRequestDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber,
      };

      const createResult = await service.createUser(mockUser);

      const result = await service.getUserById(createResult!.id);
      expect(result).toEqual({
        id: createResult!.id,
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
      const mockUser: UserCreateRequestDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doez@example.com',
        phoneNumber: '1234567890',
      };

      const createResult = await service.createUser(mockUser);

      const result = await service.getUserByEmail(createResult!.email);
      expect(result).toEqual({
        id: createResult!.id,
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
      const mockUser: UserCreateRequestDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doep@example.com',
        phoneNumber: '1234567800',
      };

      const createResult = await service.createUser(mockUser);

      const result = await service.getUserByPhoneNumber(createResult!.phoneNumber);
      expect(result).toEqual({
        id: createResult!.id,
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

      const createUserDto: UserCreateRequestDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doex@example.com',
        phoneNumber,
      };

      const result = await service.createUser(createUserDto);
      expect(result).toEqual({
        id: expect.any(String),
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        email: createUserDto.email,
        phoneNumber: createUserDto.phoneNumber,
      });

      const createdUser = await service.getUserById(result!.id);
      expect(createdUser).toEqual({
        id: result!.id,
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

      const mockUser: UserCreateRequestDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber,
      };

      const creationResult = await service.createUser(mockUser);

      const updateUserDto: UserUpdateRequestDto = {
        id: creationResult!.id,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phoneNumber: creationResult!.phoneNumber,
      };

      const result = await service.updateUser(updateUserDto);
      expect(result).toBe(true);

      const updatedUser = await service.getUserById(creationResult!.id);
      expect(updatedUser).toEqual({
        id: creationResult!.id,
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

      const mockUser: UserCreateRequestDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber,
      };

      const creationResult = await service.createUser(mockUser);

      const updateUserDto: UserUpdateRequestDto = {
        id: creationResult!.id,
        firstName: 'Jane',
        lastName: undefined,
        email: undefined,
        phoneNumber: undefined,
      };

      const result = await service.updateUser(updateUserDto);
      expect(result).toBe(true);

      const updatedUser = await service.getUserById(creationResult!.id);
      expect(updatedUser).toEqual({
        id: creationResult!.id,
        firstName: updateUserDto.firstName,
        lastName: creationResult!.lastName,
        email: creationResult!.email,
        phoneNumber: creationResult!.phoneNumber,
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

      const mockUser: UserCreateRequestDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber,
      };

      const creationResult = await service.createUser(mockUser);

      const updateUserDto: UserUpdateRequestDto = {
        id: creationResult!.id,
        firstName: 'Jane',
        lastName: '',
        email: '',
        phoneNumber: undefined,
      };

      const result = await service.updateUser(updateUserDto);
      expect(result).toBe(true);

      const updatedUser = await service.getUserById(creationResult!.id);
      expect(updatedUser).toEqual({
        id: creationResult!.id,
        firstName: updateUserDto.firstName,
        lastName: '',
        email: '',
        phoneNumber: creationResult!.phoneNumber,
      });
    });
  });

  describe('deleteUser', () => {
    it('should soft delete a user', async () => {
      // Simulate controller-level behaviour for phone number normalization
      const phoneNumber = '+12124567891';

      const mockUser: UserCreateRequestDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber,
      };

      const creationResult = await service.createUser(mockUser);

      const deleteResult = await service.deleteUser(creationResult!.id);
      expect(deleteResult).toBe(true);

      const deletedUser = await service.getUserById(creationResult!.id);
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

      const mockUser: UserCreateRequestDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber,
      };

      const creationResult = await service.createUser(mockUser);

      await service.deleteUser(creationResult!.id);

      const restoreResult = await service.restoreUser(creationResult!.id);
      expect(restoreResult).toBe(true);

      const restoredUser = await service.getUserById(creationResult!.id);
      expect(restoredUser).toEqual({
        id: creationResult!.id,
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
        await service.createUser({ ...user });
      }

      // EQ
      const equalsFilters = [{ field: 'firstName', operator: ValueOperator.EQUALS, value: 'Alice' }];
      const equalsResult = await service.search({ filters: equalsFilters });

      expect(equalsResult.data).toHaveLength(1);
      expect(equalsResult.data[0].firstName).toBe('Alice');

      // ILIKE (Case-insensitive LIKE)
      const likeFilters = [{ field: 'email', operator: ValueOperator.LIKE, value: 'davis' }];
      const likeResult = await service.search({ filters: likeFilters });

      expect(likeResult.data).toHaveLength(2);
      // adding .sort() for each array in comaprison to not recieve false negative
      expect(likeResult.data.map((r) => r.firstName).sort()).toEqual(['Bob', 'Charlie'].sort());

      // NOT EQ
      const notEqualsFilters = [{ field: 'lastName', operator: ValueOperator.NOT_EQUALS, value: 'Davis' }];
      const notEqualsResult = await service.search({ filters: notEqualsFilters });

      expect(notEqualsResult.data).toHaveLength(3);

      // MORE THAN EQ
      const moreThanFilters = [
        { field: 'phoneNumber', operator: ValueOperator.GREATER_THAN_OR_EQUAL, value: '+12124567892' },
      ];
      const moreThanResult = await service.search({ filters: moreThanFilters });

      expect(moreThanResult.data).toHaveLength(3);

      // IN
      const inFilters = [{ field: 'firstName', operator: ValueOperator.IN, value: ['Alice', 'Bob'] }];
      const inResult = await service.search({ filters: inFilters });

      expect(inResult.data).toHaveLength(2);

      // BETWEEN
      const betweenFilter = [
        { field: 'phoneNumber', operator: ValueOperator.BETWEEN, value: ['+12124567893', '+12124567894'] },
      ];
      const betweenResult = await service.search({ filters: betweenFilter });

      expect(betweenResult.data).toHaveLength(2);

      // EMPTY
      const emptyFilter = [{ field: 'deletedAt', operator: ValueOperator.EMPTY, value: null }];
      const emptyResult = await service.search({ filters: emptyFilter });

      expect(emptyResult.data).toHaveLength(5);
    });

    it('should handle pagination and filtering correctly', async () => {
      const users = Array.from({ length: 25 }, (_, i) => ({
        firstName: `User${i + 1}`,
        lastName: `Last${i + 1}`,
        email: `user${i + 1}@example.com`,
        phoneNumber: `+12124567${String(i).padStart(3, '0')}`,
      }));

      for (const user of users) {
        await service.createUser({ ...user });
      }

      // Pagination: Page 1, Limit 10
      const page1Result = await service.search({ paging: { offset: 0, limit: 10 } });
      expect(page1Result.data).toHaveLength(10);
      expect(page1Result.meta.totalCount).toBe(25);

      // Pagination: Page 2, Limit 10
      const page2Result = await service.search({ paging: { offset: 10, limit: 10 } });
      expect(page2Result.data).toHaveLength(10);
      expect(page2Result.meta.totalCount).toBe(25);

      // Pagination: Page 3, Limit 10 (should have 5 users)
      const page3Result = await service.search({ paging: { offset: 20, limit: 10 } });
      expect(page3Result.data).toHaveLength(5);
      expect(page3Result.meta.totalCount).toBe(25);

      // Filter: firstName EQUALS 'User1'
      const equalsFilter = [{ field: 'firstName', operator: ValueOperator.EQUALS, value: 'User1' }];
      const equalsResult = await service.search({ filters: equalsFilter });
      expect(equalsResult.data).toHaveLength(1);
      expect(equalsResult.data[0].firstName).toBe('User1');

      // Filter: lastName LIKE 'Last2'
      const likeFilter = [{ field: 'lastName', operator: ValueOperator.LIKE, value: 'Last2' }];
      const likeResult = await service.search({ filters: likeFilter });
      expect(likeResult.data).toHaveLength(7);

      // Filter: phoneNumber GREATER_THAN '+12124567010'
      const greaterThanFilter = [{ field: 'phoneNumber', operator: ValueOperator.GREATER_THAN, value: '+12124567010' }];
      const greaterThanResult = await service.search({ filters: greaterThanFilter });
      expect(greaterThanResult.data).toHaveLength(14);

      // Filter: firstName IN ['User1', 'User2', 'User3']
      const inFilter = [{ field: 'firstName', operator: ValueOperator.IN, value: ['User1', 'User2', 'User3'] }];
      const inResult = await service.search({ filters: inFilter });
      expect(inResult.data).toHaveLength(3);
    });
  });

  describe('edge-cases', () => {
    it('should properly handle empty search request', async () => {
      const result = await service.search({
        filters: [{ field: 'nonexistent', operator: ValueOperator.EQUALS, value: 'nonexistent' }],
      });
      expect(result.data).toHaveLength(0);
      expect(result.meta.totalCount).toBe(0);
    });
  });
});
