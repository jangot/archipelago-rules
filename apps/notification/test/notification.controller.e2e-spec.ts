import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { NotificationModule } from '../src/notification.module';

describe('NotificationController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let testDefinitionIds: string[] = [];

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
    // Создаем несколько определений уведомлений
    const definitions = [
      { name: 'Payment Reminder' },
      { name: 'Welcome Email' },
      { name: 'Loan Status Update' },
      { name: 'Security Alert' },
      { name: 'Account Verification' },
    ];

    for (const definition of definitions) {
      const response = await request(app.getHttpServer())
        .post('/notification-definitions')
        .send(definition)
        .expect(201);

      testDefinitionIds.push(response.body.id);
    }
  }

  describe('/notification-definitions (GET)', () => {
    it('should return all notification definitions', () => {
      return request(app.getHttpServer())
        .get('/notification-definitions')
        .expect(200)
        .expect((res) => {
          expect(res.body.length).toBeGreaterThanOrEqual(5);
          expect(res.body.some(d => d.name === 'Payment Reminder')).toBe(true);
          expect(res.body.some(d => d.name === 'Welcome Email')).toBe(true);
          expect(res.body.some(d => d.name === 'Loan Status Update')).toBe(true);
        });
    });
  });

  describe('/notification-definitions/:id (GET)', () => {
    it('should return 404 for non-existent definition', () => {
      return request(app.getHttpServer())
        .get('/notification-definitions/non-existent-id')
        .expect(404);
    });

    it('should return notification definition by id', () => {
      const definitionId = testDefinitionIds[0];

      return request(app.getHttpServer())
        .get(`/notification-definitions/${definitionId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(definitionId);
          expect(res.body.name).toBeDefined();
        });
    });
  });

  describe('/notification-definitions (POST)', () => {
    it('should create new notification definition', () => {
      const createDto = {
        name: 'New Test Definition',
      };

      return request(app.getHttpServer())
        .post('/notification-definitions')
        .send(createDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe('New Test Definition');
          expect(res.body.id).toBeDefined();
        });
    });

    it('should return 400 for invalid data', () => {
      const invalidDto = {
        name: '', // Пустое имя
      };

      return request(app.getHttpServer())
        .post('/notification-definitions')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('/notification-definitions/:id (PUT)', () => {
    it('should update notification definition', () => {
      const definitionId = testDefinitionIds[1];
      const updateDto = {
        name: 'Updated Welcome Email',
      };

      return request(app.getHttpServer())
        .put(`/notification-definitions/${definitionId}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBe(true);
        });
    });

    it('should return 404 for non-existent definition', () => {
      const updateDto = {
        name: 'Updated Name',
      };

      return request(app.getHttpServer())
        .put('/notification-definitions/non-existent-id')
        .send(updateDto)
        .expect(404);
    });
  });

  describe('/notification-definitions/:id (DELETE)', () => {
    it('should delete notification definition', () => {
      const definitionId = testDefinitionIds[2];

      return request(app.getHttpServer())
        .delete(`/notification-definitions/${definitionId}`)
        .expect(204);
    });

    it('should return 404 for non-existent definition', () => {
      return request(app.getHttpServer())
        .delete('/notification-definitions/non-existent-id')
        .expect(404);
    });
  });
});