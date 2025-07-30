import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';

// Import shared mocks
import './mocks';

import { NotificationModule } from '../src/notification.module';

initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

export interface TestAppOptions {
  enableValidation?: boolean;
}

export async function createTestApp(options: TestAppOptions = {}): Promise<INestApplication> {
  const { enableValidation = false } = options;

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [NotificationModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  if (enableValidation) {
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
  }

  await app.init();
  return app;
}

export async function closeTestApp(app: INestApplication): Promise<void> {
  if (app) {
    await app.close();
  }
}