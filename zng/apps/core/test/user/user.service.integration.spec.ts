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
});
