import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RegistrationService } from '../../src/auth/registration.service';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { IBackup } from 'pg-mem';
import { memoryDataSourceForTests } from '../postgress-memory-datasource';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import { AuthModule } from '../../src/auth/auth.module';

// Jest can not 'understand' camelcase-keys ESM properly. Mock it to avoid errors.
jest.mock('camelcase-keys', () => ({
  camelcaseKeys: jest.fn(),
}));

describe('AuthController - Negative Test Cases', () => {
  let app: INestApplication;
  let databaseBackup: IBackup;

  beforeAll(async () => {
    const memoryDBinstance = await memoryDataSourceForTests();
    const { dataSource, database } = memoryDBinstance;
    initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });
    
    const module: TestingModule = await Test.createTestingModule({
      imports: [CqrsModule, ConfigModule.forRoot(), AuthModule],
      controllers: [AuthController],
      providers: [
        AuthService,
        ConfigService,
        RegistrationService,
      ],
    }).overrideProvider(DataSource)
      .useValue(addTransactionalDataSource(dataSource))
      .compile();

    databaseBackup = database.backup();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    databaseBackup.restore();
  });

  describe('login', () => {
    it('should throw BadRequestException if email and phoneNumber are missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: '', phoneNumber: '' })
        .expect(400);
    });
  });

  describe('verifyLogin', () => {
    it('should throw BadRequestException if userId is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify')
        .send({ userId: '', code: '123456' })
        .expect(400);
    });

    it('should throw BadRequestException if code is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify')
        .send({ userId: 'valid-uuid', code: '' })
        .expect(400);
    });

    it('should throw UnauthorizedException if code is incorrect', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify')
        .send({ userId: 'valid-uuid', code: 'wrong-code' })
        .expect(401);
    });
  });

  describe('refreshToken', () => {
    it('should throw UnauthorizedException if refreshToken is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh-tokens')
        .send({ user: { secret: '', userId: '' } })
        .expect(401);
    });

    it('should throw UnauthorizedException if refreshToken is invalid', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh-tokens')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('logout', () => {
    it('should throw UnauthorizedException if accessToken is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ accessToken: '' })
        .expect(401);
    });

    it('should throw UnauthorizedException if accessToken is invalid', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ accessToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('register', () => {
    it('should throw BadRequestException if email and phoneNumber are missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: '', phoneNumber: '' })
        .expect(400);
    });
  });

  describe('verifyRegistration', () => {
    it('should throw BadRequestException if userId is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-registration')
        .send({ userId: '', code: '123456' })
        .expect(400);
    });

    it('should throw BadRequestException if code is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-registration')
        .send({ userId: 'valid-uuid', code: '' })
        .expect(400);
    });

    it('should throw UnauthorizedException if code is incorrect', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-registration')
        .send({ userId: 'valid-uuid', code: 'wrong-code' })
        .expect(401);
    });
  });

  describe('updateRegistration', () => {
    it('should throw BadRequestException if userId is missing', async () => {
      await request(app.getHttpServer())
        .put('/auth/update-registration')
        .send({ userId: '', email: 'test@email.com' })
        .expect(400);
    });
  });
});
