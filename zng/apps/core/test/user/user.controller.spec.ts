import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../../src/users/users.controller';
import { UsersService } from '../../src/users/users.service';
import { UserCreateRequestDto, UserResponseDto, UserUpdateRequestDto } from 'apps/core/src/dto';
import { ContactType } from '@library/entity/enum';

describe('UserController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: { getUserById: jest.fn(), getUserByContact: jest.fn(), createUser: jest.fn(), updateUser: jest.fn() } },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      const userId = '1';
      const userResponse: UserResponseDto = { id: userId, email: 'test@test.com', phoneNumber: '1234567890', firstName: 'Test', lastName: 'User' };
      jest.spyOn(service, 'getUserById').mockResolvedValue(userResponse);

      const result = await controller.getUserById(userId);
      expect(result).toEqual(userResponse);
      expect(service.getUserById).toHaveBeenCalledWith(userId);
    });
  });

  describe('getUserByEmail', () => {
    it('should return a user by email', async () => {
      const email = 'test@test.com';
      const userResponse: UserResponseDto = { id: '1', email, phoneNumber: '1234567890', firstName: 'Test', lastName: 'User' };
      jest.spyOn(service, 'getUserByContact').mockResolvedValue(userResponse);

      const result = await controller.getUserByParameter({ email });
      expect(result).toEqual(userResponse);
      expect(service.getUserByContact).toHaveBeenCalledWith(email, ContactType.EMAIL);
    });
  });

  describe('getUserByPhoneNumber', () => {
    it('should return a user by phone number', async () => {
      const phoneNumber = '1234567890';
      const userResponse: UserResponseDto = { id: '1', email: 'test@test.com', phoneNumber, firstName: 'Test', lastName: 'User' };
      jest.spyOn(service, 'getUserByContact').mockResolvedValue(userResponse);

      const result = await controller.getUserByParameter({ phoneNumber });
      expect(result).toEqual(userResponse);
      expect(service.getUserByContact).toHaveBeenCalledWith(phoneNumber, ContactType.PHONE_NUMBER);
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const userCreateDto: UserCreateRequestDto = { email: 'test@test.com', phoneNumber: '+12124567890', firstName: 'Test', lastName: 'User' };
      const userResponse: UserResponseDto = { id: '1', email: 'test@test.com', phoneNumber: '+12124567890', firstName: 'Test', lastName: 'User' };
      jest.spyOn(service, 'createUser').mockResolvedValue(userResponse);

      const result = await controller.createUser(userCreateDto);
      expect(result).toEqual(userResponse);
      expect(service.createUser).toHaveBeenCalledWith(userCreateDto);
    });
  });

  describe('updateUser', () => {
    it('should update an existing user', async () => {
      const userUpdateDto: UserUpdateRequestDto = { id: '1', email: 'updated@test.com', phoneNumber: '+12124567890' };
      jest.spyOn(service, 'updateUser').mockResolvedValue(true);

      const result = await controller.updateUser(userUpdateDto);
      expect(result).toBe(true);
      expect(service.updateUser).toHaveBeenCalledWith(userUpdateDto);
    });
  });
});
