import { Test, TestingModule } from '@nestjs/testing';
import { NotificationApiController } from './notification-api.controller';
import { NotificationApiService } from './notification-api.service';

describe('NotificationApiController', () => {
  let notificationApiController: NotificationApiController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [NotificationApiController],
      providers: [NotificationApiService],
    }).compile();

    notificationApiController = app.get<NotificationApiController>(NotificationApiController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(notificationApiController.getHello()).toBe('Hello World!');
    });
  });
});
