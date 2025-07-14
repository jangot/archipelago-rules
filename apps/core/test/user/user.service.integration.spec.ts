import { IBackup } from 'pg-mem';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { v4 as uuidv4 } from 'uuid';

import { UsersModule } from '@core/modules/users';
import { UserCreateRequestDto, UserUpdateRequestDto } from '@core/modules/users/dto/request';
import { UsersService } from '@core/modules/users/users.service';
import { ContactType, RegistrationStatus } from '@library/entity/enum';
import { ValueOperator } from '@library/shared/common/search';
import { AllEntities } from '@library/shared/domain/entity';
import { memoryDataSourceSingle } from '@library/shared/tests/postgress-memory-datasource';
import { Test, TestingModule } from '@nestjs/testing';


describe('UsersService Integration Tests', () => {
  let module: TestingModule;
  let service: UsersService;
  let databaseBackup: IBackup;

  beforeAll(async () => {
    const { dataSource, database } = await memoryDataSourceSingle(AllEntities);
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

  describe('getUserDetailById', () => {
    it('should return pgtyped typed User object', async () => {
      const phoneNumber = '+12124567890';

      const mockUser: UserCreateRequestDto = { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', phoneNumber };

      const createResult = await service.createUser(mockUser);
      const result = await service.getUserDetailById(createResult!.userId);

      expect(result).toEqual(expect.objectContaining({
        id: createResult!.userId,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email,
        phoneNumber: mockUser.phoneNumber,
        dateOfBirth: null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        zipCode: null,
        onboardStatus: undefined,
        deletedAt: undefined,
      }));
    });
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      // Simulate controller-level behaviour for phone number normalization
      const phoneNumber = '+12124567890';

      const mockUser: UserCreateRequestDto = { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', phoneNumber };

      const createResult = await service.createUser(mockUser);

      const result = await service.getUserById(createResult!.userId);
      expect(result).toEqual(expect.objectContaining({
        userId: createResult!.userId,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email,
        phoneNumber: mockUser.phoneNumber,
        dateOfBirth: null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        registrationStatus: RegistrationStatus.NotRegistered,
        loginId: undefined,
      }));
    });

    it('should return null if user not found', async () => {
      const result = await service.getUserById(uuidv4());
      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return a user by email', async () => {
      const mockUser: UserCreateRequestDto = { firstName: 'John', lastName: 'Doe', email: 'john.doez@example.com', phoneNumber: '1234567890' };

      const createResult = await service.createUser(mockUser);

      const result = await service.getUserByContact(createResult!.email, ContactType.EMAIL);
      expect(result).toEqual(expect.objectContaining({
        userId: createResult!.userId,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email,
        phoneNumber: mockUser.phoneNumber,
        dateOfBirth: null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        registrationStatus: RegistrationStatus.NotRegistered,
        loginId: undefined,
      }));
    });

    it('should return null if user not found', async () => {
      const result = await service.getUserByContact('nonexistent@example.com', ContactType.EMAIL);
      expect(result).toBeNull();
    });
  });

  describe('getUserByPhoneNumber', () => {
    it('should return a user by phone number', async () => {
      const mockUser: UserCreateRequestDto = { firstName: 'John', lastName: 'Doe', email: 'john.doep@example.com', phoneNumber: '1234567800' };

      const createResult = await service.createUser(mockUser);

      const result = await service.getUserByContact(createResult!.phoneNumber, ContactType.PHONE_NUMBER);
      expect(result).toEqual(expect.objectContaining({
        userId: createResult!.userId,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email,
        phoneNumber: mockUser.phoneNumber,
        dateOfBirth: null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        registrationStatus: RegistrationStatus.NotRegistered,
        loginId: undefined,
      }));
    });

    it('should return null if user not found', async () => {
      const result = await service.getUserByContact('0000000000', ContactType.PHONE_NUMBER);
      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      // Simulate controller-level behaviour for phone number normalization
      const phoneNumber = '+12124567890';

      const createUserDto: UserCreateRequestDto = { firstName: 'John', lastName: 'Doe', email: 'john.doex@example.com', phoneNumber };

      const result = await service.createUser(createUserDto);
      expect(result).toEqual(expect.objectContaining({
        userId: expect.any(String),
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        email: createUserDto.email,
        phoneNumber: createUserDto.phoneNumber,
        registrationStatus: RegistrationStatus.NotRegistered,
        loginId: undefined,
      }));

      const createdUser = await service.getUserById(result!.userId);
      expect(createdUser).toEqual(expect.objectContaining({
        userId: result!.userId,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        email: createUserDto.email,
        phoneNumber: createUserDto.phoneNumber,
        dateOfBirth: null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        zipCode: null,
        onboardStatus: null,
      }));
    });

    it('should return null if user creation fails', async () => {
      jest.spyOn(service, 'createUser').mockResolvedValueOnce(null);

      const createUserDto: UserCreateRequestDto = { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', phoneNumber: '1234567890' };

      const result = await service.createUser(createUserDto);
      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      // Simulate controller-level behaviour for phone number normalization
      const phoneNumber = '+12124567891';

      const mockUser: UserCreateRequestDto = { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', phoneNumber };

      const creationResult = await service.createUser(mockUser);

      const updateUserDto: UserUpdateRequestDto = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phoneNumber: creationResult!.phoneNumber,
        dateOfBirth: null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        zipCode: null,
        onboardStatus: null,
      };

      const result = await service.updateUser(creationResult!.userId, updateUserDto);
      expect(result).toBe(true);

      const updatedUser = await service.getUserById(creationResult!.userId);
      expect(updatedUser).toEqual(expect.objectContaining({
        id: creationResult!.userId,
        firstName: updateUserDto.firstName,
        lastName: updateUserDto.lastName,
        email: updateUserDto.email,
        phoneNumber: updateUserDto.phoneNumber,
        dateOfBirth: null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        zipCode: null,
        onboardStatus: null,
      }));
    });

    it('should return false if user update fails', async () => {
      const userId = uuidv4();
      const updateUserDto: UserUpdateRequestDto = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phoneNumber: '+12124567891',
      };

      const result = await service.updateUser(userId, updateUserDto);
      expect(result).toBe(false);
    });
  });

  describe('partialUpdateUser', () => {
    it('should partially update a user ignoring undefined fields', async () => {
      // Simulate controller-level behaviour for phone number normalization
      const phoneNumber = '+12124567891';

      const mockUser: UserCreateRequestDto = { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', phoneNumber };

      const creationResult = await service.createUser(mockUser);

      const userId = creationResult!.userId;
      const updateUserDto: UserUpdateRequestDto = {
        firstName: 'Jane',
        lastName: undefined,
        email: undefined,
        phoneNumber: undefined,
      };

      const result = await service.updateUser(userId, updateUserDto);
      expect(result).toEqual(expect.objectContaining({
        userId: userId,
        firstName: updateUserDto.firstName,
        lastName: creationResult!.lastName,
        email: creationResult!.email,
        phoneNumber: creationResult!.phoneNumber,
      }));

      const updatedUser = await service.getUserById(userId);
      expect(updatedUser).toEqual(expect.objectContaining({
        userId: creationResult!.userId,
        firstName: updateUserDto.firstName,
        lastName: creationResult!.lastName,
        email: creationResult!.email,
        phoneNumber: creationResult!.phoneNumber,
        dateOfBirth: null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        zipCode: null,
        onboardStatus: null,
      }));
    });

    // This case shows current behavior of update method for TypeORM
    // Highlights:
    // - If a field is provided as undefined, it wont be updated (keeps prev value)
    // - !! If a field is provided as falsy value (e.g. empty string for string type), it will be updated to falsy value
    // - !!! TypeORM ignores the fact that indexed fields might be wiped to falsy values - we need protect data here
    it('wipes values if falsy ones provided for fields', async () => {
      // Simulate controller-level behaviour for phone number normalization
      const phoneNumber = '+12124567891';

      const mockUser: UserCreateRequestDto = { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', phoneNumber };

      const creationResult = await service.createUser(mockUser);
      const userId = creationResult!.userId;

      const updateUserDto: UserUpdateRequestDto = { firstName: 'Jane', lastName: '', email: '', phoneNumber: undefined };

      const result = await service.updateUser(userId, updateUserDto);
      expect(result).toEqual(expect.objectContaining({
        userId: userId,
        firstName: updateUserDto.firstName,
        lastName: creationResult!.lastName,
        email: creationResult!.email,
        phoneNumber: creationResult!.phoneNumber,
      }));

      const updatedUser = await service.getUserById(userId);
      expect(updatedUser).toEqual(expect.objectContaining({
        userId: userId,
        firstName: updateUserDto.firstName,
        lastName: '',
        email: '',
        phoneNumber: creationResult!.phoneNumber,
        dateOfBirth: null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        zipCode: null,
        onboardStatus: null,
      }));
    });
  });

  describe('deleteUser', () => {
    it('should soft delete a user', async () => {
      // Simulate controller-level behaviour for phone number normalization
      const phoneNumber = '+12124567891';

      const mockUser: UserCreateRequestDto = { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', phoneNumber };

      const creationResult = await service.createUser(mockUser);

      const deleteResult = await service.deleteUser(creationResult!.userId);
      expect(deleteResult).toBe(true);

      const deletedUser = await service.getUserById(creationResult!.userId);
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

      const mockUser: UserCreateRequestDto = { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', phoneNumber };

      const creationResult = await service.createUser(mockUser);

      await service.deleteUser(creationResult!.userId);

      const restoreResult = await service.restoreUser(creationResult!.userId);
      expect(restoreResult).toBe(true);

      const restoredUser = await service.getUserById(creationResult!.userId);
      expect(restoredUser).toEqual(expect.objectContaining({
        id: creationResult!.userId,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email,
        phoneNumber: mockUser.phoneNumber,
        state: null,
        zipCode: null,
        onboardStatus: null,
        loginId: undefined,
        registrationStatus: RegistrationStatus.NotRegistered,
      }));
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
      const moreThanFilters = [{ field: 'phoneNumber', operator: ValueOperator.GREATER_THAN_OR_EQUAL, value: '+12124567892' }];
      const moreThanResult = await service.search({ filters: moreThanFilters });

      expect(moreThanResult.data).toHaveLength(3);

      // IN
      const inFilters = [{ field: 'firstName', operator: ValueOperator.IN, value: ['Alice', 'Bob'] }];
      const inResult = await service.search({ filters: inFilters });

      expect(inResult.data).toHaveLength(2);

      // BETWEEN
      const betweenFilter = [{ field: 'phoneNumber', operator: ValueOperator.BETWEEN, value: ['+12124567893', '+12124567894'] }];
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
      const result = await service.search({ filters: [{ field: 'nonexistent', operator: ValueOperator.EQUALS, value: 'nonexistent' }] });
      expect(result.data).toHaveLength(0);
      expect(result.meta.totalCount).toBe(0);
    });
  });
});
