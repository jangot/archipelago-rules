import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { closeTestApp, createTestApp } from './test-utils';

describe('NotificationController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('should return health status', async () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200);
  });
});
