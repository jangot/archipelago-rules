import { NotificationDataItems } from '@library/entity/enum/notification-data-items';
import { NotificationType } from '@library/entity/enum/notification.type';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { closeTestApp, createTestApp } from './test-utils';

describe('NotificationDefinitionItemController (e2e)', () => {
  let app: INestApplication;
  let createdDefinitionId: string;
  let createdItemId: string;

  beforeAll(async () => {
    app = await createTestApp({ enableValidation: true });

    // Create a notification definition for testing
    const createDefinitionDto = {
      name: 'test_notification_definition',
      dataItems: [NotificationDataItems.User],
    };

    const definitionResponse = await request(app.getHttpServer())
      .post('/notification-definitions')
      .send(createDefinitionDto);

    createdDefinitionId = definitionResponse.body.id;

    // Create a notification definition item for testing
    const createItemDto = {
      notificationDefinitionId: createdDefinitionId,
      orderIndex: 1,
      notificationType: NotificationType.Email,
      template: 'Hello <%= name %>',
      header: 'Payment Reminder for <%= userName %>',
      body: 'Dear <%= userName %>, your payment of $<%= amount %> is due on <%= dueDate %>',
      target: '<%= userEmail %>',
      metadata: '{"userId": "<%= userId %>", "loanId": "<%= loanId %>", "amount": "<%= amount %>"}',
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

  describe('GET /notification-definition-items', () => {
    it('should return all notification definition items', async () => {
      return request(app.getHttpServer())
        .get('/notification-definition-items')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should filter notification definition items by notificationDefinitionId', async () => {
      return request(app.getHttpServer())
        .get(`/notification-definition-items?notificationDefinitionId=${createdDefinitionId}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          res.body.forEach((item: any) => {
            expect(item.notificationDefinitionId).toBe(createdDefinitionId);
          });
        });
    });

    it('should return empty array for non-existent notificationDefinitionId', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      return request(app.getHttpServer())
        .get(`/notification-definition-items?notificationDefinitionId=${nonExistentId}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(0);
        });
    });

    it('should return 400 for invalid UUID in notificationDefinitionId', async () => {
      return request(app.getHttpServer())
        .get('/notification-definition-items?notificationDefinitionId=invalid-uuid')
        .expect(400);
    });
  });

  describe('GET /notification-definition-items/:id', () => {
    it('should return a notification definition item by ID', async () => {
      return request(app.getHttpServer())
        .get(`/notification-definition-items/${createdItemId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.id).toBe(createdItemId);
          expect(res.body).toHaveProperty('notificationDefinitionId');
          expect(res.body).toHaveProperty('orderIndex');
          expect(res.body).toHaveProperty('notificationType');
        });
    });

    it('should return 404 for non-existent notification definition item', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      return request(app.getHttpServer())
        .get(`/notification-definition-items/${nonExistentId}`)
        .expect(404);
    });

    it('should return 400 for invalid UUID', async () => {
      return request(app.getHttpServer())
        .get('/notification-definition-items/invalid-uuid')
        .expect(400);
    });
  });

  describe('POST /notification-definition-items', () => {
    it('should create a new notification definition item', async () => {
      const createDto = {
        notificationDefinitionId: createdDefinitionId,
        orderIndex: 2,
        notificationType: NotificationType.SMS,
        template: 'SMS: <%= message %>',
        header: 'SMS Alert for <%= userName %>',
        body: 'Hi <%= userName %>, your payment reminder: $<%= amount %> due <%= dueDate %>',
        target: '<%= userPhone %>',
        metadata: '{"userId": "<%= userId %>", "type": "sms", "amount": "<%= amount %>"}',
        attributes: {},
      };

      return request(app.getHttpServer())
        .post('/notification-definition-items')
        .send(createDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.notificationDefinitionId).toBe(createDto.notificationDefinitionId);
          expect(res.body.orderIndex).toBe(createDto.orderIndex);
          expect(res.body.notificationType).toBe(createDto.notificationType);
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
        });
    });

    it('should return 400 for invalid request data', async () => {
      const invalidDto = {
        notificationDefinitionId: 'invalid-uuid',
        orderIndex: 'invalid-order',
        notificationType: 'invalid-type',
      };

      return request(app.getHttpServer())
        .post('/notification-definition-items')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('PUT /notification-definition-items/:id', () => {
    it('should update an existing notification definition item', async () => {
      const updateDto = {
        orderIndex: 3,
        notificationType: NotificationType.Amplitude,
        template: 'Amplitude Event: <%= eventName %>',
        header: 'Analytics Event for <%= userId %>',
        body: 'User <%= userName %> triggered event <%= eventName %> with data <%= eventData %>',
        target: '<%= amplitudeUserId %>',
        metadata: '{"userId": "<%= userId %>", "eventName": "<%= eventName %>", "properties": <%= eventProperties %>}',
        attributes: { key: 'value' },
      };

      return request(app.getHttpServer())
        .put(`/notification-definition-items/${createdItemId}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
        });
    });

    it('should return 404 for non-existent notification definition item', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';
      const updateDto = {
        orderIndex: 4,
        notificationType: NotificationType.Email,
      };

      return request(app.getHttpServer())
        .put(`/notification-definition-items/${nonExistentId}`)
        .send(updateDto)
        .expect(404);
    });

    it('should return 400 for invalid UUID', async () => {
      const updateDto = {
        orderIndex: 5,
        notificationType: NotificationType.Email,
      };

      return request(app.getHttpServer())
        .put('/notification-definition-items/invalid-uuid')
        .send(updateDto)
        .expect(400);
    });
  });

  describe('DELETE /notification-definition-items/:id', () => {
    let itemToDeleteId: string;

    beforeAll(async () => {
      // Create a notification definition item for testing deletion
      const createDto = {
        notificationDefinitionId: createdDefinitionId,
        orderIndex: 10,
        notificationType: NotificationType.Email,
        template: 'Delete test template for <%= userName %>',
        header: 'Test Header for <%= userName %>',
        body: 'This is a test body for user <%= userName %> with ID <%= userId %>',
        target: '<%= userEmail %>',
        metadata: '{"userId": "<%= userId %>", "testType": "deletion", "timestamp": "<%= timestamp %>"}',
        attributes: {},
      };

      const response = await request(app.getHttpServer())
        .post('/notification-definition-items')
        .send(createDto);

      itemToDeleteId = response.body.id;
    });

    it('should delete an existing notification definition item', async () => {
      return request(app.getHttpServer())
        .delete(`/notification-definition-items/${itemToDeleteId}`)
        .expect(204);
    });

    it('should return 404 for non-existent notification definition item', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      return request(app.getHttpServer())
        .delete(`/notification-definition-items/${nonExistentId}`)
        .expect(404);
    });

    it('should return 400 for invalid UUID', async () => {
      return request(app.getHttpServer())
        .delete('/notification-definition-items/invalid-uuid')
        .expect(400);
    });
  });
});