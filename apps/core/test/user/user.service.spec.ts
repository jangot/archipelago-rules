import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { UsersService } from '@core/modules/users/users.service';
import { IDomainServices } from '@core/modules/domain/idomain.services';
import { UserCreateRequestDto, UserUpdateRequestDto, UserDetailsUpdateRequestDto } from '@core/modules/users/dto/request';
import { UserResponseDto, UserDetailsUpdateResponseDto } from '@core/modules/users/dto/response';
import { ContactType } from '@library/entity/enum';
import { EntityNotFoundException, EntityFailedToUpdateException } from '@library/shared/common/exception/domain';

describe('UsersService', () => {
  let service: UsersService;

  const mockDomainServices = {
    userServices: {
      getUserById: jest.fn(),
      getUserByContact: jest.fn(),
      createNewUser: jest.fn(),
      updateUser: jest.fn(),
      softDeleteUser: jest.fn(),
      restoreUser: jest.fn(),
    },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        Logger,
        { provide: IDomainServices, useValue: mockDomainServices },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      const user = { id: '1', email: 'test@test.com' };
      mockDomainServices.userServices.getUserById.mockResolvedValue(user);

      const result = await service.getUserById('1');
      expect(result).toEqual(expect.any(UserResponseDto));
      expect(mockDomainServices.userServices.getUserById).toHaveBeenCalledWith('1');
    });

    it('should return null if user not found', async () => {
      mockDomainServices.userServices.getUserById.mockResolvedValue(null);

      const result = await service.getUserById('1');
      expect(result).toBeNull();
    });
  });

  describe('getUserByContact', () => {
    it('should return a user by email', async () => {
      const user = { id: '1', email: 'test@test.com' };
      mockDomainServices.userServices.getUserByContact.mockResolvedValue(user);

      const result = await service.getUserByContact('test@test.com', ContactType.EMAIL);
      expect(result).toEqual(expect.any(UserResponseDto));
      expect(mockDomainServices.userServices.getUserByContact).toHaveBeenCalledWith('test@test.com', ContactType.EMAIL);
    });

    it('should return null if user not found by email', async () => {
      mockDomainServices.userServices.getUserByContact.mockResolvedValue(null);

      const result = await service.getUserByContact('test@test.com', ContactType.EMAIL);
      expect(result).toBeNull();
    });

    it('should return a user by phone number', async () => {
      const user = { id: '1', phoneNumber: '1234567890' };
      mockDomainServices.userServices.getUserByContact.mockResolvedValue(user);

      const result = await service.getUserByContact('1234567890', ContactType.PHONE_NUMBER);
      expect(result).toEqual(expect.any(UserResponseDto));
      expect(mockDomainServices.userServices.getUserByContact).toHaveBeenCalledWith('1234567890', ContactType.PHONE_NUMBER);
    });

    it('should return null if user not found by phone number', async () => {
      mockDomainServices.userServices.getUserByContact.mockResolvedValue(null);

      const result = await service.getUserByContact('1234567890', ContactType.PHONE_NUMBER);
      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const createUserDto: UserCreateRequestDto = { email: 'test@test.com', phoneNumber: '1234567890', firstName: 'Test', lastName: 'User' };
      const user = { id: '1', ...createUserDto };
      mockDomainServices.userServices.createNewUser.mockResolvedValue(user);

      const result = await service.createUser(createUserDto);
      expect(result).toEqual(expect.any(UserResponseDto));
      expect(mockDomainServices.userServices.createNewUser).toHaveBeenCalledWith(expect.objectContaining(createUserDto));
    });
  });

  describe('updateUser', () => {
    it('should update an existing user', async () => {
      const updateUserDto: UserUpdateRequestDto = { id: '1', email: 'updated@test.com' };
      mockDomainServices.userServices.updateUser.mockResolvedValue(true);

      const result = await service.updateUser(updateUserDto);
      expect(result).toBe(true);
      expect(mockDomainServices.userServices.updateUser).toHaveBeenCalledWith(expect.objectContaining(updateUserDto));
    });

    it('should return null if update fails', async () => {
      const updateUserDto: UserUpdateRequestDto = { id: '1', email: 'updated@test.com' };
      mockDomainServices.userServices.updateUser.mockResolvedValue(false);

      const result = await service.updateUser(updateUserDto);
      expect(result).toBe(false);
    });
  });

  describe('updateUserDetails', () => {
    it('should update user details', async () => {
      const userId = '1';
      const updates: UserDetailsUpdateRequestDto = {
        firstName: 'Updated', lastName: 'User',
        dateOfBirth: null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        zipCode: null,
      };
      const existingUser = { id: userId, email: 'test@test.com', firstName: 'Test', lastName: 'User' };
      const updatedUser = { ...existingUser, ...updates };

      mockDomainServices.userServices.getUserById.mockResolvedValue(existingUser);
      mockDomainServices.userServices.updateUser.mockResolvedValue(true);
      mockDomainServices.userServices.getUserById.mockResolvedValueOnce(updatedUser);

      const result = await service.updateUserDetails(userId, updates);
      expect(result).toEqual(expect.any(UserDetailsUpdateResponseDto));
      expect(mockDomainServices.userServices.updateUser).toHaveBeenCalledWith(expect.objectContaining(updatedUser));
    });

    it('should throw EntityNotFoundException if user does not exist', async () => {
      const userId = 'non-existent-id';
      const updates: UserDetailsUpdateRequestDto = {
        firstName: 'Updated', lastName: 'User',
        dateOfBirth: null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        zipCode: null,
      };

      mockDomainServices.userServices.getUserById.mockResolvedValue(null);

      await expect(service.updateUserDetails(userId, updates)).rejects.toThrow(EntityNotFoundException);
    });

    it('should throw EntityFailedToUpdateException if update fails', async () => {
      const userId = '1';
      const updates: UserDetailsUpdateRequestDto = {
        firstName: 'Updated', lastName: 'User',
        dateOfBirth: null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        zipCode: null,
      };
      const existingUser = { id: userId, email: 'test@test.com', firstName: 'Test', lastName: 'User' };

      mockDomainServices.userServices.getUserById.mockResolvedValue(existingUser);
      mockDomainServices.userServices.updateUser.mockResolvedValue(false);

      await expect(service.updateUserDetails(userId, updates)).rejects.toThrow(EntityFailedToUpdateException);
    });
  });

  describe('deleteUser', () => {
    it('should soft delete a user', async () => {
      const userId = '1';
      mockDomainServices.userServices.softDeleteUser.mockResolvedValue(true);

      const result = await service.deleteUser(userId);
      expect(result).toBe(true);
      expect(mockDomainServices.userServices.softDeleteUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('restoreUser', () => {
    it('should restore a soft-deleted user', async () => {
      const userId = '1';
      mockDomainServices.userServices.restoreUser.mockResolvedValue(true);

      const result = await service.restoreUser(userId);
      expect(result).toBe(true);
      expect(mockDomainServices.userServices.restoreUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('isNewUser', () => {
    it('should return true if both email and phone number are not found', async () => {
      mockDomainServices.userServices.getUserByContact.mockResolvedValue(null);

      const result = await service.isNewUser('new@test.com', '1234567890');
      expect(result).toBe(true);
      expect(mockDomainServices.userServices.getUserByContact).toHaveBeenCalledTimes(2);
    });

    it('should return false if email is already registered', async () => {
      const existingUser = { id: '1', email: 'existing@test.com' };
      mockDomainServices.userServices.getUserByContact
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(null);

      const result = await service.isNewUser('existing@test.com', '1234567890');
      expect(result).toBe(false);
      expect(mockDomainServices.userServices.getUserByContact).toHaveBeenCalledTimes(2);
    });

    it('should return false if phone number is already registered', async () => {
      const existingUser = { id: '1', phoneNumber: '1234567890' };
      mockDomainServices.userServices.getUserByContact
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingUser);

      const result = await service.isNewUser('new@test.com', '1234567890');
      expect(result).toBe(false);
      expect(mockDomainServices.userServices.getUserByContact).toHaveBeenCalledTimes(2);
    });
  });
});
