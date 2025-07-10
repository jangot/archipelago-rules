import { UserResponseDto } from '@core/modules/users/dto/response';
import { UsersController } from '@core/modules/users/users.controller';
import { UsersService } from '@core/modules/users/users.service';
import { RegistrationStatus } from '@library/entity/enum';
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
});
