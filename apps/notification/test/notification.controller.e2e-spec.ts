import { NotificationDataItems } from '@library/entity/enum/notification-data-items';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { closeTestApp, createTestApp } from './test-utils';

/**
 * Generates a unique name for notification definitions in tests
 * @param baseName - Base name for the notification definition
 * @returns Unique name with timestamp
 */
function generateUniqueName(baseName: string): string {
  return `${baseName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

describe('NotificationController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp({ enableValidation: true });
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  describe('GET /notification-definitions', () => {
    it('should return all notification definitions', async () => {
      return request(app.getHttpServer())
        .get('/notification-definitions')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /notification-definitions/:id', () => {
    it('should return 404 for non-existent notification definition', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      return request(app.getHttpServer())
        .get(`/notification-definitions/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('POST /notification-definitions', () => {
    it('should create a new notification definition', async () => {
      const createDto = {
        name: generateUniqueName('test_notification'),
        dataItems: [NotificationDataItems.User, NotificationDataItems.Loan],
      };

      return request(app.getHttpServer())
        .post('/notification-definitions')
        .send(createDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe(createDto.name);
          expect(res.body.dataItems).toEqual(createDto.dataItems);
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
        });
    });

    it('should return 400 for invalid request data', async () => {
      const invalidDto = {
        name: '',
        dataItems: ['invalid_type'],
      };

      return request(app.getHttpServer())
        .post('/notification-definitions')
        .send(invalidDto)
        .expect(400);
    });

    it('should return 400 for duplicate name', async () => {
      const duplicateName = generateUniqueName('duplicate_test');
      const createDto = {
        name: duplicateName,
        dataItems: [NotificationDataItems.User],
      };

      // Create first notification definition
      await request(app.getHttpServer())
        .post('/notification-definitions')
        .send(createDto)
        .expect(201);

      // Try to create second notification definition with same name
      return request(app.getHttpServer())
        .post('/notification-definitions')
        .send(createDto)
        .expect(400);
    });
  });

  describe('PUT /notification-definitions/:id', () => {
    let createdDefinitionId: string;

    beforeAll(async () => {
      // Create a notification definition for testing updates
      const createDto = {
        name: generateUniqueName('update_test_notification'),
        dataItems: [NotificationDataItems.User],
      };

      const response = await request(app.getHttpServer())
        .post('/notification-definitions')
        .send(createDto);

      createdDefinitionId = response.body.id;
    });

    it('should update an existing notification definition', async () => {
      const updateDto = {
        name: generateUniqueName('updated_notification_name'),
        dataItems: [NotificationDataItems.User, NotificationDataItems.Loan],
      };

      return request(app.getHttpServer())
        .put(`/notification-definitions/${createdDefinitionId}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
        });
    });

    it('should return 404 for non-existent notification definition', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';
      const updateDto = {
        name: generateUniqueName('updated_name'),
        dataItems: [NotificationDataItems.User],
      };

      return request(app.getHttpServer())
        .put(`/notification-definitions/${nonExistentId}`)
        .send(updateDto)
        .expect(404);
    });
  });

  describe('DELETE /notification-definitions/:id', () => {
    let createdDefinitionId: string;

    beforeAll(async () => {
      // Create a notification definition for testing deletion
      const createDto = {
        name: generateUniqueName('delete_test_notification'),
        dataItems: [NotificationDataItems.User],
      };

      const response = await request(app.getHttpServer())
        .post('/notification-definitions')
        .send(createDto);

      createdDefinitionId = response.body.id;
    });

    it('should delete an existing notification definition', async () => {
      return request(app.getHttpServer())
        .delete(`/notification-definitions/${createdDefinitionId}`)
        .expect(204);
    });

    it('should return 404 for non-existent notification definition', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      return request(app.getHttpServer())
        .delete(`/notification-definitions/${nonExistentId}`)
        .expect(404);
    });
  });
});
