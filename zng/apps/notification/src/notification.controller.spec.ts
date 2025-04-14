import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationDefinitionService } from './domain/services/notification.definition.service';
import { NotificationDefinitionResponseDto } from './dto/response/notification-definition.response.dto';

describe('NotificationController', () => {
  let notificationController: NotificationController;
  let notificationService: NotificationService;
  let notificationDefinitionService: NotificationDefinitionService;

  beforeEach(async () => {
    const mockNotificationService = {
      getHello: jest.fn().mockReturnValue('Hello World!'),
    };

    const mockNotificationDefinitionService = {
      getAllDefinitions: jest.fn().mockResolvedValue([]),
      getDefinitionById: jest.fn().mockResolvedValue(new NotificationDefinitionResponseDto()),
      createDefinition: jest.fn().mockResolvedValue(new NotificationDefinitionResponseDto()),
      updateDefinition: jest.fn().mockResolvedValue(new NotificationDefinitionResponseDto()),
      deleteDefinition: jest.fn().mockResolvedValue(undefined),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: NotificationDefinitionService, useValue: mockNotificationDefinitionService },
      ],
    }).compile();

    notificationController = app.get<NotificationController>(NotificationController);
    notificationService = app.get<NotificationService>(NotificationService);
    notificationDefinitionService = app.get<NotificationDefinitionService>(NotificationDefinitionService);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(notificationController.getHello()).toBe('Hello World!');
      expect(notificationService.getHello).toHaveBeenCalled();
    });
  });

  describe('notification definitions', () => {
    it('should get all definitions', async () => {
      await notificationController.getAllDefinitions();
      expect(notificationDefinitionService.getAllDefinitions).toHaveBeenCalled();
    });

    it('should get definition by id', async () => {
      const id = '123';
      await notificationController.getDefinitionById(id);
      expect(notificationDefinitionService.getDefinitionById).toHaveBeenCalledWith(id);
    });

    it('should create definition', async () => {
      const createDto = {};
      await notificationController.createDefinition(createDto as any);
      expect(notificationDefinitionService.createDefinition).toHaveBeenCalledWith(createDto);
    });

    it('should update definition', async () => {
      const id = '123';
      const updateDto = {};
      await notificationController.updateDefinition(id, updateDto as any);
      expect(notificationDefinitionService.updateDefinition).toHaveBeenCalledWith(id, updateDto);
    });

    it('should delete definition', async () => {
      const id = '123';
      await notificationController.deleteDefinition(id);
      expect(notificationDefinitionService.deleteDefinition).toHaveBeenCalledWith(id);
    });
  });
});
