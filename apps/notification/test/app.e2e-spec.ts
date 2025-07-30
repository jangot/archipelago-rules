import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';

// Mock nestjs-graceful-shutdown before importing NotificationModule
jest.mock('nestjs-graceful-shutdown', () => ({
  GracefulShutdownModule: {
    forRoot: jest.fn(() => ({
      module: class MockGracefulShutdownModule {},
      providers: [],
      exports: [],
    })),
  },
  setupGracefulShutdown: jest.fn(),
}));

import { NotificationModule } from '../src/notification.module';

initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

describe('NotificationController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [NotificationModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should return health status', async () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200);
  });
});
