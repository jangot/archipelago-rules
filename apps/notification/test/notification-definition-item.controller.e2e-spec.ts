import { NotificationType } from '@library/entity/enum/notification.type';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { NotificationModule } from '../src/notification.module';

describe('NotificationDefinitionItemController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let testDefinitionIds: string[] = [];
  let testItemIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [NotificationModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Создаем стабильные тестовые данные для заполнения базы
    await createTestData();
  });

  afterAll(async () => {
    await app.close();
  });

  async function createTestData() {
    // Создаем определения уведомлений
    const definitions = [
      { name: 'Payment Reminder' },
      { name: 'Welcome Email' },
      { name: 'Loan Status Update' },
    ];

    for (const definition of definitions) {
      const response = await request(app.getHttpServer())
        .post('/notification-definitions')
        .send(definition)
        .expect(201);

      testDefinitionIds.push(response.body.id);
    }

    // Создаем элементы уведомлений для каждого определения
    const items = [
      // Элементы для Payment Reminder
      {
        notificationDefinitionId: testDefinitionIds[0],
        orderIndex: 1,
        notificationType: NotificationType.Email,
        template: 'Hello {{name}}, your payment of {{amount}} is due on {{dueDate}}',
        header: 'Payment Reminder',
        body: 'Please make your payment on time to avoid late fees.',
        target: '{{email}}',
      },
      {
        notificationDefinitionId: testDefinitionIds[0],
        orderIndex: 2,
        notificationType: NotificationType.SMS,
        template: 'Payment reminder: {{amount}} due on {{dueDate}}',
        header: 'Payment Due',
        body: 'Your payment is due soon.',
        target: '{{phone}}',
      },
      // Элементы для Welcome Email
      {
        notificationDefinitionId: testDefinitionIds[1],
        orderIndex: 1,
        notificationType: NotificationType.Email,
        template: 'Welcome {{name}} to our platform!',
        header: 'Welcome to ZNG',
        body: 'Thank you for joining us. We\'re excited to have you on board!',
        target: '{{email}}',
      },
      {
        notificationDefinitionId: testDefinitionIds[1],
        orderIndex: 2,
        notificationType: NotificationType.Amplitude,
        template: 'User {{name}} registered',
        header: 'New User Registration',
        body: 'Track user onboarding',
        target: 'analytics',
      },
      // Элементы для Loan Status Update
      {
        notificationDefinitionId: testDefinitionIds[2],
        orderIndex: 1,
        notificationType: NotificationType.Email,
        template: 'Your loan status has been updated to {{status}}',
        header: 'Loan Status Update',
        body: 'Your loan application has been processed.',
        target: '{{email}}',
      },
      {
        notificationDefinitionId: testDefinitionIds[2],
        orderIndex: 2,
        notificationType: NotificationType.SMS,
        template: 'Loan {{loanId}} status: {{status}}',
        header: 'Loan Update',
        body: 'Your loan status has changed.',
        target: '{{phone}}',
      },
    ];

    for (const item of items) {
      const response = await request(app.getHttpServer())
        .post('/notification-definition-items')
        .send(item)
        .expect(201);

      testItemIds.push(response.body.id);
    }
  }

  describe('/notification-definition-items (GET)', () => {
    it('should return all notification definition items', () => {
      return request(app.getHttpServer())
        .get('/notification-definition-items')
        .expect(200)
        .expect((res) => {
          expect(res.body.length).toBeGreaterThanOrEqual(6);
          expect(res.body.some(item => item.notificationType === NotificationType.Email)).toBe(true);
          expect(res.body.some(item => item.notificationType === NotificationType.SMS)).toBe(true);
          expect(res.body.some(item => item.notificationType === NotificationType.Amplitude)).toBe(true);
        });
    });
  });

  describe('/notification-definition-items/:id (GET)', () => {
    it('should return 404 for non-existent item', () => {
      return request(app.getHttpServer())
        .get('/notification-definition-items/non-existent-id')
        .expect(404);
    });

    it('should return notification definition item by id', () => {
      const itemId = testItemIds[0];

      return request(app.getHttpServer())
        .get(`/notification-definition-items/${itemId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(itemId);
          expect(res.body.notificationType).toBe(NotificationType.Email);
          expect(res.body.header).toBe('Payment Reminder');
        });
    });
  });

  describe('/notification-definition-items (POST)', () => {
    it('should create new notification definition item', () => {
      const createDto = {
        notificationDefinitionId: testDefinitionIds[0],
        orderIndex: 3,
        notificationType: NotificationType.Email,
        template: 'Hello {{name}}',
        header: 'Test Header',
        body: 'Test Body',
        target: 'user@example.com',
      };

      return request(app.getHttpServer())
        .post('/notification-definition-items')
        .send(createDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.notificationType).toBe(NotificationType.Email);
          expect(res.body.header).toBe('Test Header');
          expect(res.body.id).toBeDefined();
        });
    });

    it('should return 400 for invalid data', () => {
      const invalidDto = {
        notificationDefinitionId: 'invalid-uuid',
        orderIndex: 'not-a-number',
        notificationType: 'InvalidType',
      };

      return request(app.getHttpServer())
        .post('/notification-definition-items')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('/notification-definition-items/:id (PUT)', () => {
    it('should update notification definition item', () => {
      const itemId = testItemIds[1];
      const updateDto = {
        orderIndex: 3,
        notificationType: NotificationType.SMS,
        template: 'Updated SMS template',
        header: 'Updated Header',
        body: 'Updated Body',
        target: 'updated@example.com',
      };

      return request(app.getHttpServer())
        .put(`/notification-definition-items/${itemId}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBe(true);
        });
    });

    it('should return 404 for non-existent item', () => {
      const updateDto = {
        orderIndex: 2,
        notificationType: NotificationType.SMS,
      };

      return request(app.getHttpServer())
        .put('/notification-definition-items/non-existent-id')
        .send(updateDto)
        .expect(404);
    });
  });

  describe('/notification-definition-items/:id (DELETE)', () => {
    it('should delete notification definition item', () => {
      const itemId = testItemIds[2];

      return request(app.getHttpServer())
        .delete(`/notification-definition-items/${itemId}`)
        .expect(204);
    });

    it('should return 404 for non-existent item', () => {
      return request(app.getHttpServer())
        .delete('/notification-definition-items/non-existent-id')
        .expect(404);
    });
  });

  describe('/notification-definitions/:notificationDefinitionId/items (GET)', () => {
    it('should return all items for specific notification definition', () => {
      const definitionId = testDefinitionIds[0]; // Payment Reminder

      return request(app.getHttpServer())
        .get(`/notification-definitions/${definitionId}/items`)
        .expect(200)
        .expect((res) => {
          expect(res.body.length).toBeGreaterThanOrEqual(2);
          expect(res.body.every(item => item.notificationDefinitionId === definitionId)).toBe(true);
        });
    });

    it('should return empty array when no items exist for definition', () => {
      // Создаем новое определение без элементов
      return request(app.getHttpServer())
        .post('/notification-definitions')
        .send({ name: 'Empty Definition' })
        .expect(201)
        .then((createResponse) => {
          const emptyDefinitionId = createResponse.body.id;

          return request(app.getHttpServer())
            .get(`/notification-definitions/${emptyDefinitionId}/items`)
            .expect(204);
        });
    });
  });
});