import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { ConfigModule } from '@nestjs/config';
import { RegistrationService } from '../../src/auth/registration.service';
import * as request from 'supertest';
import { INestApplication, Logger } from '@nestjs/common';
import { CommandBus, CqrsModule } from '@nestjs/cqrs';
import { IBackup } from 'pg-mem';
import { memoryDataSourceForTests } from '../postgress-memory-datasource';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import { LoginCommandHandlers } from '../../src/auth/login/commands';
import { UsersModule } from '../../src/users';
import { DataModule } from '../../src/data';
import { DomainModule } from '../../src/domain/domain.module';
import { JwtModule } from '@nestjs/jwt';
import { CustomAuthStrategies } from '../../src/auth/strategies';
import { CustomAuthGuards, JwtAuthGuard, LogoutAuthGuard, RefreshTokenAuthGuard } from '../../src/auth/guards';
import { RegistrationCommandHandlers } from '../../src/auth/registration/commands';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter, DomainExceptionsFilter } from '@library/shared/common/filters';
import { LoginInitiateCommandHandler } from '../../src/auth/login/commands/login.initiate.command';
import { DomainExceptionCode } from '@library/shared/common/exceptions/domain';
import { REGISTERED_USER_DUMP_1 } from './data-dump';

// Jest can not 'understand' camelcase-keys ESM properly. Mock it to avoid errors.
jest.mock('camelcase-keys', () => ({
  camelcaseKeys: jest.fn(),
}));
// TODO: investigate why .env variable do not make an effect
jest.setTimeout(300000);

describe('AuthController - Negative Test Cases', () => {
  let app: INestApplication;
  let databaseBackup: IBackup;

  let authService: AuthService;
  let authServiceLoginInitiateSpy: jest.SpyInstance;

  let commandBus: CommandBus;
  let commandBusSpy: jest.SpyInstance;
  let loginInitiateHandler: LoginInitiateCommandHandler;
  let loginInitiateHandlerSpy: jest.SpyInstance;

  beforeAll(async () => {
    const memoryDBinstance = await memoryDataSourceForTests();
    const { dataSource, database } = memoryDBinstance;
    initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });
    
    // Build the complete copy of AuthModule
    const module: TestingModule = await Test.createTestingModule({
      imports: [CqrsModule, UsersModule, ConfigModule.forRoot(), DataModule, DomainModule, JwtModule],
      controllers: [AuthController],
      providers: [
        Logger,
        AuthService,
        RegistrationService,
        ...CustomAuthStrategies,
        ...CustomAuthGuards,
        ...RegistrationCommandHandlers,
        ...LoginCommandHandlers,
        // Use another way of ExceptionFilters injection as it is only way to have them in test module
        { provide: APP_FILTER, useClass: AllExceptionsFilter }, { provide: APP_FILTER, useClass: DomainExceptionsFilter },
      ],
    }).overrideProvider(DataSource)
      .useValue(addTransactionalDataSource(dataSource))
      .compile();


    authService = module.get<AuthService>(AuthService);
    commandBus = module.get<CommandBus>(CommandBus);
    loginInitiateHandler = module.get<LoginInitiateCommandHandler>(LoginInitiateCommandHandler);

    // Initiate data in database before backup
    database.getSchema('core').none(REGISTERED_USER_DUMP_1);

    databaseBackup = database.backup();
    app = module.createNestApplication();
    await app.init();


  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.restoreAllMocks();
    databaseBackup.restore();
  });

  describe('login', () => {
    it('email and phoneNumber are missing - should throw an expection 400 from controller', async () => {
      authServiceLoginInitiateSpy = jest.spyOn(authService, 'initiateLoginSession');
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: '', phoneNumber: '' })
        .expect(400);

      // Check that we even to not call AuthService
      expect(authServiceLoginInitiateSpy).not.toHaveBeenCalled();
    });

    it('email and phoneNumber both provided - should throw an expection 400 from controller', async () => {
      authServiceLoginInitiateSpy = jest.spyOn(authService, 'initiateLoginSession');
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'abc', phoneNumber: 'abc' })
        .expect(400);

      // Check that we even to not call AuthService
      expect(authServiceLoginInitiateSpy).not.toHaveBeenCalled();
    });

    it('invalid email provided - should throw an expection 404 from controller', async () => {
      authServiceLoginInitiateSpy = jest.spyOn(authService, 'initiateLoginSession');
      loginInitiateHandlerSpy = jest.spyOn(loginInitiateHandler, 'execute');
      commandBusSpy = jest.spyOn(commandBus, 'execute');
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'abc', phoneNumber: '' })
        .expect(404);

      expect(response.body).toEqual(expect.objectContaining({
        statusCode: 404,
        errorCode: DomainExceptionCode.EntityNotFound,
        message: 'No matching user found',
      }));

      // Check that once call AuthService
      expect(authServiceLoginInitiateSpy).toHaveBeenCalledTimes(1);
      expect(authServiceLoginInitiateSpy).toHaveBeenCalledWith({ 'email': 'abc', 'phoneNumber': '' });
      // Check that CommandBus was called once
      expect(commandBusSpy).toHaveBeenCalledTimes(1);
      expect(commandBusSpy).toHaveBeenCalledWith({ 'payload': { 'contact': 'abc', 'contactType': 'email' } });
      // Check that proper command handler was called with expected payload
      expect(loginInitiateHandlerSpy).toHaveBeenCalledTimes(1);
      expect(loginInitiateHandlerSpy).toHaveBeenCalledWith({ 'payload': { 'contact': 'abc', 'contactType': 'email' } });
    });

    it('invalid phone provided - should throw an expection 404 from controller', async () => {
      authServiceLoginInitiateSpy = jest.spyOn(authService, 'initiateLoginSession');
      loginInitiateHandlerSpy = jest.spyOn(loginInitiateHandler, 'execute');
      commandBusSpy = jest.spyOn(commandBus, 'execute');
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: '', phoneNumber: 'abc' })
        .expect(404);

      expect(response.body).toEqual(expect.objectContaining({
        statusCode: 404,
        errorCode: DomainExceptionCode.EntityNotFound,
        message: 'No matching user found',
      }));

      // Check that once call AuthService
      expect(authServiceLoginInitiateSpy).toHaveBeenCalledTimes(1);
      expect(authServiceLoginInitiateSpy).toHaveBeenCalledWith({ 'email': '', 'phoneNumber': 'abc' });
      // Check that CommandBus was called once
      expect(commandBusSpy).toHaveBeenCalledTimes(1);
      expect(commandBusSpy).toHaveBeenCalledWith({ 'payload': { 'contact': 'abc', 'contactType': 'phoneNumber' } });
      // Check that proper command handler was called with expected payload
      expect(loginInitiateHandlerSpy).toHaveBeenCalledTimes(1);
      expect(loginInitiateHandlerSpy).toHaveBeenCalledWith({ 'payload': { 'contact': 'abc', 'contactType': 'phoneNumber' } });
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

    it('should throw Login session is not initiated (403) as User not initiated email login', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/verify')
        .send({ userId: '2bacf5cb-9fa9-47c9-b560-9ea3766cc201', email: 'registration-verify-test1@email.com', code: 'wrong-code' })
        .expect(403);

      expect(response.body).toEqual(expect.objectContaining({
        statusCode: 403,
        errorCode: DomainExceptionCode.LoginSessionNotInitiated,
        message: 'Login session is not initiated',
      }));
    });

    it('should fail as verification code is wrong (400)', async () => {
      // Correctly initiate login session first
      const loginIntitateResponse = await request(app.getHttpServer()).post('/auth/login')
        .send({ email: 'registration-verify-test1@email.com', phoneNumber: '' })
        .expect(201);

      expect(loginIntitateResponse.body).toEqual({
        userId: '2bacf5cb-9fa9-47c9-b560-9ea3766cc201',
        verificationCode: expect.any(String),
      });

      const verifyResponse = await request(app.getHttpServer())
        .post('/auth/verify')
        .send({ userId: '2bacf5cb-9fa9-47c9-b560-9ea3766cc201', email: 'registration-verify-test1@email.com', code: 'wrong-code' })
        .expect(400);

      expect(verifyResponse.body).toEqual(expect.objectContaining({
        statusCode: 400,
        errorCode: DomainExceptionCode.VerificationCodeMismatch,
        message: 'Verification code mismatch',
      }));
    });

    // TODO: we are allowing to log in by any contact here by same code!!!
    // Is it expected?
    it('should fail as session was initiated for other contact (400)', async () => {
      // Correctly initiate login session first
      const loginIntitateResponse = await request(app.getHttpServer()).post('/auth/login')
        .send({ email: '', phoneNumber: '+12124567993' })
        .expect(201);

      const correctVerificationCode = loginIntitateResponse.body.verificationCode;
      expect(loginIntitateResponse.body).toEqual({
        userId: '2bacf5cb-9fa9-47c9-b560-9ea3766cc201',
        verificationCode: expect.any(String),
      });

      // Here we place email instead of phone number (for which we assigned secret)
      // Is it correct expectance that here error should be thrown?
      const verifyResponse = await request(app.getHttpServer())
        .post('/auth/verify')
        .send({ userId: '2bacf5cb-9fa9-47c9-b560-9ea3766cc201', email: 'registration-verify-test1@email.com', code: correctVerificationCode })
        .expect(400);

      expect(verifyResponse.body).toEqual(expect.objectContaining({
        statusCode: 400,
        errorCode: DomainExceptionCode.VerificationCodeMismatch,
        message: 'Verification code mismatch',
      }));
    });

  });

  describe('refreshToken', () => {
    it('ensures that /refresh is protected by proper guard', async () => {
      const refreshGuards = Reflect.getMetadata('__guards__', AuthController.prototype.refreshTokens);
      const guard = new (refreshGuards[0]);

      expect(guard).toBeInstanceOf(RefreshTokenAuthGuard);
    });

    it('should 401 if authorization header is empty', async () => {
      await request(app.getHttpServer())
        .get('/auth/refresh')
        //.set({ 'authorization': '' })
        .send({})
        .expect(401);

    });

    it('should 401 if authorization header is invalid', async () => {
      await request(app.getHttpServer())
        .get('/auth/refresh')
        .set({ 'authorization': 'invalid-token' })
        .send({})
        .expect(401);
    });
  });

  describe('logout', () => {
    it('ensures that /logout is protected by proper guard', async () => {
      const logoutGuards = Reflect.getMetadata('__guards__', AuthController.prototype.logout);
      const guard = new (logoutGuards[0]);

      expect(guard).toBeInstanceOf(LogoutAuthGuard);
    });
    it('should throw UnauthorizedException if accessToken is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        //.set({ 'authorization': '' })
        .send({})
        .expect(401);
    });

    it('should throw UnauthorizedException if accessToken is invalid', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set({ 'authorization': 'invalid-token' })
        .send({})
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
    it('ensures that PUT /register is protected by proper guard', async () => {
      const registerGuards = Reflect.getMetadata('__guards__', AuthController.prototype.updateVerificationField);
      const guard = new (registerGuards[0]);

      expect(guard).toBeInstanceOf(JwtAuthGuard);
    });
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
