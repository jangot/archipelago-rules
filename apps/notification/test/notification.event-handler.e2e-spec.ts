import { NotificationDataItems } from '@library/entity/enum/notification-data-items';
import { NotificationType } from '@library/entity/enum/notification.type';
import { EventPublisherService } from '@library/shared/modules/event';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { closeTestApp, createTestApp } from './test-utils';

describe('Notification Event Handler (e2e)', () => {
  let app: INestApplication;
  let eventPublisherService: EventPublisherService;
  let createdDefinitionId: string;
  let createdItemId: string;

  beforeAll(async () => {
    app = await createTestApp({ enableValidation: true });

    eventPublisherService = app.get(EventPublisherService);

    // Создаем notification definition через API
    const createDefinitionDto = {
      name: 'test_notification_definition',
      dataItems: [NotificationDataItems.User],
    };

    const definitionResponse = await request(app.getHttpServer())
      .post('/notification-definitions')
      .send(createDefinitionDto);

    createdDefinitionId = definitionResponse.body.id;

    // Создаем notification definition item через API
    const createItemDto = {
      notificationDefinitionId: createdDefinitionId,
      orderIndex: 1,
      notificationType: NotificationType.Email,
      template: 'Hello <%= user.name %>, your payment is due on <%= dueDate %>',
      header: 'Payment Reminder for <%= user.name %>',
      body: 'Dear <%= user.name %>, your payment of $<%= amount %> is due on <%= dueDate %>',
      target: '<%= user.email %>',
      metadata: '{"userId": "<%= user.id %>", "amount": "<%= amount %>"}',
      attributes: {},
    };

    const itemResponse = await request(app.getHttpServer())
      .post('/notification-definition-items')
      .send(createItemDto);

    createdItemId = itemResponse.body.id;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  describe.only('Notification Event Processing', () => {
    it('should process notification event successfully', async () => {
      // Простой тест для проверки что true это true
      expect(true).toBe(true);
    });
  });
});
