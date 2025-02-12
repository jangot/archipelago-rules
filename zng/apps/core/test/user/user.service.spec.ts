import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../src/users/users.service';
import { IDataService } from '../../src/data/idata.service';
import { HttpException } from '@nestjs/common';
import { ApplicationUser } from '../../src/data/entity';
import { v4 } from 'uuid';
import { UserCreateRequestDto, UserResponseDto, UserUpdateRequestDto } from 'apps/core/src/dto';

describe('UserService', () => {
  let service: UsersService;
  let dataService: IDataService;

  const mockDataService = {
    users: {
      getById: jest.fn(),
      getByEmail: jest.fn(),
      getByPhone: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: IDataService, useValue: mockDataService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    dataService = module.get<IDataService>(IDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      const user = { id: '1', email: 'test@test.com' } as ApplicationUser;
      mockDataService.users.getById.mockResolvedValue(user);

      const result = await service.getUserById('1');
      expect(result).toEqual(expect.any(UserResponseDto));
      expect(mockDataService.users.getById).toHaveBeenCalledWith('1');
    });

    it('should throw an exception if user not found', async () => {
      mockDataService.users.getById.mockResolvedValue(null);

      await expect(service.getUserById('1')).rejects.toThrow(HttpException);
    });
  });

  describe('getUserByEmail', () => {
    it('should return a user by email', async () => {
      const user = { id: '1', email: 'test@test.com' } as ApplicationUser;
      mockDataService.users.getByEmail.mockResolvedValue(user);

      const result = await service.getUserByEmail('test@test.com');
      expect(result).toEqual(expect.any(UserResponseDto));
      expect(mockDataService.users.getByEmail).toHaveBeenCalledWith('test@test.com');
    });

    it('should throw an exception if user not found', async () => {
      mockDataService.users.getByEmail.mockResolvedValue(null);

      await expect(service.getUserByEmail('test@test.com')).rejects.toThrow(HttpException);
    });
  });

  describe('getUserByPhoneNumber', () => {
    it('should return a user by phone number', async () => {
      const user = { id: '1', phoneNumber: '1234567890' } as ApplicationUser;
      mockDataService.users.getByPhone.mockResolvedValue(user);

      const result = await service.getUserByPhoneNumber('1234567890');
      expect(result).toEqual(expect.any(UserResponseDto));
      expect(mockDataService.users.getByPhone).toHaveBeenCalledWith('1234567890');
    });

    it('should throw an exception if user not found', async () => {
      mockDataService.users.getByPhone.mockResolvedValue(null);

      await expect(service.getUserByPhoneNumber('1234567890')).rejects.toThrow(HttpException);
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const createUserDto: UserCreateRequestDto = { email: 'test@test.com', phoneNumber: '1234567890', firstName: 'Test', lastName: 'User' };
      const user = { id: v4(), ...createUserDto } as ApplicationUser;
      mockDataService.users.create.mockResolvedValue(user);

      const result = await service.createUser(createUserDto);
      expect(result).toEqual(expect.any(UserResponseDto));
      expect(mockDataService.users.create).toHaveBeenCalledWith(expect.objectContaining(createUserDto));
    });
  });

  describe('updateUser', () => {
    it('should update an existing user', async () => {
      const updateUserDto: UserUpdateRequestDto = { id: '1', email: 'updated@test.com' };
      mockDataService.users.update.mockResolvedValue(true);

      const result = await service.updateUser(updateUserDto);
      expect(result).toBe(true);
      expect(mockDataService.users.update).toHaveBeenCalledWith('1', expect.objectContaining(updateUserDto));
    });

    it('should throw an exception if update fails', async () => {
      const updateUserDto: UserUpdateRequestDto = { id: '1', email: 'updated@test.com' };
      mockDataService.users.update.mockRejectedValue(new HttpException('Update failed', 400));

      await expect(service.updateUser(updateUserDto)).rejects.toThrow(HttpException);
    });
  });
});
