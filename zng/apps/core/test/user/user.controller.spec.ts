import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../../src/user/user.controller';
import { UserService } from '../../src/user/user.service';
import { UserCreateRequestDto, UserUpdateRequestDto } from '@library/dto/request';
import { UserResponseDto } from '@library/dto/response';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            getUserById: jest.fn(),
            getUserByEmail: jest.fn(),
            getUserByPhoneNumber: jest.fn(),
            createUser: jest.fn(),
            updateUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
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
      jest.spyOn(service, 'getUserByEmail').mockResolvedValue(userResponse);

      const result = await controller.getUserByEmail(email);
      expect(result).toEqual(userResponse);
      expect(service.getUserByEmail).toHaveBeenCalledWith(email);
    });
  });

  describe('getUserByPhoneNumber', () => {
    it('should return a user by phone number', async () => {
      const phoneNumber = '1234567890';
      const userResponse: UserResponseDto = { id: '1', email: 'test@test.com', phoneNumber, firstName: 'Test', lastName: 'User' };
      jest.spyOn(service, 'getUserByPhoneNumber').mockResolvedValue(userResponse);

      const result = await controller.getUserByPhoneNumber(phoneNumber);
      expect(result).toEqual(userResponse);
      expect(service.getUserByPhoneNumber).toHaveBeenCalledWith(phoneNumber);
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const userCreateDto: UserCreateRequestDto = { email: 'test@test.com', phoneNumber: '1234567890', firstName: 'Test', lastName: 'User' };
      const userResponse: UserResponseDto = { id: '1', email: 'test@test.com', phoneNumber: '1234567890', firstName: 'Test', lastName: 'User' };
      jest.spyOn(service, 'createUser').mockResolvedValue(userResponse);

      const result = await controller.createUser(userCreateDto);
      expect(result).toEqual(userResponse);
      expect(service.createUser).toHaveBeenCalledWith(userCreateDto);
    });
  });

  describe('updateUser', () => {
    it('should update an existing user', async () => {
      const userUpdateDto: UserUpdateRequestDto = { id: '1', email: 'updated@test.com', phoneNumber: '0987654321' };
      jest.spyOn(service, 'updateUser').mockResolvedValue(true);

      const result = await controller.updateUser(userUpdateDto);
      expect(result).toBe(true);
      expect(service.updateUser).toHaveBeenCalledWith(userUpdateDto);
    });
  });
});
