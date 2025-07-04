import { UserResponseDto } from '@core/modules/users/dto/response';
import { UsersController } from '@core/modules/users/users.controller';
import { UsersService } from '@core/modules/users/users.service';
import { ContactType, RegistrationStatus } from '@library/entity/enum';
import { Test, TestingModule } from '@nestjs/testing';

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
      const userResponse: UserResponseDto = { id: userId, email: 'test@test.com', phoneNumber: '1234567890', firstName: 'Test', lastName: 'User', registrationStatus: RegistrationStatus.NotRegistered };
      jest.spyOn(service, 'getUserById').mockResolvedValue(userResponse);

      const result = await controller.getUserById(userId);
      expect(result).toEqual(userResponse);
      expect(service.getUserById).toHaveBeenCalledWith(userId);
    });
  });

  describe('getUserByEmail', () => {
    it('should return a user by email', async () => {
      const email = 'test@test.com';
      const userResponse: UserResponseDto = { id: '1', email, phoneNumber: '1234567890', firstName: 'Test', lastName: 'User', registrationStatus: RegistrationStatus.NotRegistered };
      jest.spyOn(service, 'getUserByContact').mockResolvedValue(userResponse);

      const result = await controller.getUserByParameter({ email });
      expect(result).toEqual(userResponse);
      expect(service.getUserByContact).toHaveBeenCalledWith(email, ContactType.EMAIL);
    });
  });

  describe('getUserByPhoneNumber', () => {
    it('should return a user by phone number', async () => {
      const phoneNumber = '1234567890';
      const userResponse: UserResponseDto = { id: '1', email: 'test@test.com', phoneNumber, firstName: 'Test', lastName: 'User', registrationStatus: RegistrationStatus.NotRegistered };
      jest.spyOn(service, 'getUserByContact').mockResolvedValue(userResponse);

      const result = await controller.getUserByParameter({ phoneNumber });
      expect(result).toEqual(userResponse);
      expect(service.getUserByContact).toHaveBeenCalledWith(phoneNumber, ContactType.PHONE_NUMBER);
    });
  });
});
