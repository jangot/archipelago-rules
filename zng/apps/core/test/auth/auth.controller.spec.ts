import { IBackup } from 'pg-mem';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { INestApplication, Logger } from '@nestjs/common';
import { CommandBus, CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter, DomainExceptionsFilter } from '@library/shared/common/filters';
import { RegistrationStatus } from '@library/entity/enum';
import { BaseDomainExceptionCodes } from '@library/shared/common/exceptions/domain';
import { CoreDomainExceptionCodes } from '@core/domain/exceptions';
import { AuthController } from '@core/auth/auth.controller';
import { AuthService } from '@core/auth/auth.service';
import { RegistrationService } from '@core/auth/registration.service';
import { LoginCommandHandlers } from '@core/auth/login/commands';
import { UsersModule } from '@core/users';
import { DataModule } from '@core/data';
import { DomainModule } from '@core/domain/domain.module';
import { CustomAuthStrategies } from '@core/auth/strategies';
import { CustomAuthGuards, JwtAuthGuard, LogoutAuthGuard, RefreshTokenAuthGuard } from '@core/auth/guards';
import { RegistrationCommandHandlers } from '@core/auth/registration/commands';
import { LoginInitiateCommandHandler } from '@core/auth/login/commands/login.initiate.command';
import { UserDomainService } from '@core/domain/services/user.domain.service';

import { memoryDataSourceForTests } from '../postgress-memory-datasource';
import { REGISTERED_USER_DUMP_1 } from './data-dump';
import { generateWrongCode } from './test.helper';
import { DbSchemaCodes } from '@library/shared/common/data';

describe('AuthController - Negative Test Cases', () => {
  let app: INestApplication;
  let databaseBackup: IBackup;

  let authService: AuthService;
  let authServiceLoginInitiateSpy: jest.SpyInstance;

  let userDomainService: UserDomainService;

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
    userDomainService = module.get<UserDomainService>(UserDomainService);
    commandBus = module.get<CommandBus>(CommandBus);
    loginInitiateHandler = module.get<LoginInitiateCommandHandler>(LoginInitiateCommandHandler);

    // Initiate data in database before backup
    database.getSchema(DbSchemaCodes.Core).none(REGISTERED_USER_DUMP_1);

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
        errorCode: BaseDomainExceptionCodes.EntityNotFound,
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
        errorCode: BaseDomainExceptionCodes.EntityNotFound,
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
        errorCode: CoreDomainExceptionCodes.LoginSessionNotInitiated,
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
        errorCode: CoreDomainExceptionCodes.VerificationCodeMismatch,
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
        errorCode: CoreDomainExceptionCodes.WrongVerificationType,
        message: 'User has a different verification type',
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
    
    it('should throw BadRequestException if email is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: '' })
        .expect(400);

      expect(response.body).toEqual(expect.objectContaining({
        statusCode: 400,
        message: 'Email is missing during registration initiation',
        errorCode: BaseDomainExceptionCodes.MissingInput,
      }));
    });

    // existing email
    it('should return 400 if email is already registered', async () => {
      const takenEmail = 'registration-verify-test1@email.com';
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: takenEmail })
        .expect(409);

      expect(response.body).toEqual(expect.objectContaining({
        statusCode: 409,
        message: `Email already taken: ${takenEmail}`,
        errorCode: CoreDomainExceptionCodes.ContactTaken,
      }));
    });

    // pending email
    it('should allow to continue registration if it was dropped on pending email', async () => {
      const registrationEmail = 'registration-verify-test2@email.com';
      // first attempt
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: registrationEmail })
        .expect(201);

      // Here we assume that registration was dropped and some time passed

      // These spies should be visited
      const getUserByContactSpy = jest.spyOn(userDomainService, 'getUserByContact');
      const getUserRegistrationSpy = jest.spyOn(userDomainService, 'getUserRegistration');
      const codeGenSpy = jest.spyOn(userDomainService, 'generateCode');
      const updateRegistrationSpy = jest.spyOn(userDomainService, 'updateUserRegistration');
      // Spies below should not be visited (as it is for first registration attempt)
      const createNewUserSpy = jest.spyOn(userDomainService, 'createNewUser');
      const createNewUserRegistrationSpy = jest.spyOn(userDomainService, 'createNewUserRegistration');
        
      const secondAttempt = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: registrationEmail })
        .expect(201);

      expect(secondAttempt.body).toEqual(expect.objectContaining({
        email: registrationEmail,
        verificationCode: expect.any(String),
        id: expect.any(String),
        phoneNumber: null,
        verificationState: RegistrationStatus.EmailVerifying,
      }));

      // Search for user - 2 calls, one for registered, second for pending
      expect(getUserByContactSpy).toHaveBeenCalledTimes(2);
      // Here code fall into 'reInitiateEmailVerification'
      expect(getUserRegistrationSpy).toHaveBeenCalledTimes(1);
      expect(codeGenSpy).toHaveBeenCalledTimes(1);
      expect(updateRegistrationSpy).toHaveBeenCalledTimes(1);
      // These should not be called
      expect(createNewUserSpy).not.toHaveBeenCalled();
      expect(createNewUserRegistrationSpy).not.toHaveBeenCalled();

    });
  });

  describe('verifyRegistration', () => {
    it('ensures that PUT /register is protected by proper guard', async () => {
      const registerGuards = Reflect.getMetadata('__guards__', AuthController.prototype.updateVerificationField);
      const guard = new (registerGuards[0]);

      expect(guard).toBeInstanceOf(JwtAuthGuard);
    });
    // Stage 1 (email) checks
    it('should return 400 if userId is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register/verify')
        .send({ userId: '', code: '123456' })
        .expect(400);

      expect(response.body).toEqual(expect.objectContaining({
        statusCode: 400,
        message: 'User ID is required for verification',
      }));
    });

    it('should return 400 for code missmatch if code is empty', async () => {
      const registrationEmail = 'registration-verify-test2@email.com';

      const registrationInit = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: registrationEmail })
        .expect(201);

      const { id } = registrationInit.body;
      const verifyResponse = await request(app.getHttpServer())
        .post('/auth/register/verify')
        .send({ userId: id, code: '' })
        .expect(400);

      expect(verifyResponse.body).toEqual(expect.objectContaining({
        errorCode: CoreDomainExceptionCodes.VerificationCodeMismatch,
        message: `Verification code mismatch for user ${id}`,
        statusCode: 400,
      }));

    });

    it('should return 400 for code missmatch if code is incorrect', async () => {
      const registrationEmail = 'registration-verify-test3@email.com';

      const registrationInit = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: registrationEmail })
        .expect(201);

      const { id, verificationCode } = registrationInit.body;

      const wrongCode = generateWrongCode(verificationCode);
      const verifyResponse = await request(app.getHttpServer())
        .post('/auth/register/verify')
        .send({ userId: id, code: wrongCode })
        .expect(400);

      expect(verifyResponse.body).toEqual(expect.objectContaining({
        errorCode: CoreDomainExceptionCodes.VerificationCodeMismatch,
        message: `Verification code mismatch for user ${id}`,
        statusCode: 400,
      }));
    });

    // Stage 2 (phoneNumber) checks
    it('should return 401 if auth header is empty on stage 2', async () => {
      const registrationEmail = 'registration-verify-test5@email.com';
      const registrationPhoneNumber = '+12124567995';

      const registrationInit = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: registrationEmail })
        .expect(201);

      const { id, verificationCode } = registrationInit.body;
      await request(app.getHttpServer())
        .post('/auth/register/verify')
        .send({ userId: id, code: verificationCode })
        .expect(201);

      await request(app.getHttpServer())
        .put('/auth/register')
        .send({ userId: id, phoneNumber: registrationPhoneNumber })
        .expect(401);
    });
    it('should return 400 for code missmatch if code is empty on stage 2', async () => {
      const registrationEmail = 'registration-verify-test5@email.com';
      const registrationPhoneNumber = '+12124567995';

      const registrationInit = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: registrationEmail })
        .expect(201);

      const { id, verificationCode } = registrationInit.body;
      const verifyResponse = await request(app.getHttpServer())
        .post('/auth/register/verify')
        .send({ userId: id, code: verificationCode })
        .expect(201);

      const { accessToken } = verifyResponse.body;

      await request(app.getHttpServer())
        .put('/auth/register')
        .set({ 'authorization': `Bearer ${accessToken}` })
        .send({ userId: id, phoneNumber: registrationPhoneNumber })
        .expect(200);


      const secondVerifyResponse = await request(app.getHttpServer())
        .post('/auth/register/verify')
        .set({ 'authorization': `Bearer ${accessToken}` })
        .send({ userId: id, code: '' })
        .expect(400);

      expect(secondVerifyResponse.body).toEqual(expect.objectContaining({
        errorCode: CoreDomainExceptionCodes.VerificationCodeMismatch,
        message: `Verification code mismatch for user ${id}`,
        statusCode: 400,
      }));

    });

    it('should return 400 for code missmatch if code is incorrect on stage 2', async () => {
      const registrationEmail = 'registration-verify-test6@email.com';
      const registrationPhoneNumber = '+12124567996';

      const registrationInit = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: registrationEmail })
        .expect(201);

      const { id, verificationCode } = registrationInit.body;
      const verifyResponse = await request(app.getHttpServer())
        .post('/auth/register/verify')
        .send({ userId: id, code: verificationCode })
        .expect(201);

      const { accessToken } = verifyResponse.body;

      const phoneNumberResult = await request(app.getHttpServer())
        .put('/auth/register')
        .set({ 'authorization': `Bearer ${accessToken}` })
        .send({ userId: id, phoneNumber: registrationPhoneNumber })
        .expect(200);
      const { verificationCode: phoneCode } = phoneNumberResult.body;
      const wrongCode = generateWrongCode(phoneCode);
      const secondVerifyResponse = await request(app.getHttpServer())
        .post('/auth/register/verify')
        .set({ 'authorization': `Bearer ${accessToken}` })
        .send({ userId: id, code: wrongCode })
        .expect(400);

      expect(secondVerifyResponse.body).toEqual(expect.objectContaining({
        errorCode: CoreDomainExceptionCodes.VerificationCodeMismatch,
        message: `Verification code mismatch for user ${id}`,
        statusCode: 400,
      }));
    });

  });

  describe('login attempts', () => {
    it('should allow to try to log in for 5 times, then block for 15 minutes', async () => {
      const userEmail = 'registration-verify-test1@email.com';
      const loginIntitateResponse = await request(app.getHttpServer()).post('/auth/login')
        .send({ email: userEmail, phoneNumber: '' })
        .expect(201);

      expect(loginIntitateResponse.body).toEqual({
        userId: '2bacf5cb-9fa9-47c9-b560-9ea3766cc201',
        verificationCode: expect.any(String),
      });

      const { userId, verificationCode } = loginIntitateResponse.body;
      const wrongCode = generateWrongCode(verificationCode);

      // First fail attempt
      await request(app.getHttpServer())
        .post('/auth/verify')
        .send({ userId, code: wrongCode, email: userEmail })
        .expect(400);
      
      const fail1User = await userDomainService.getUserById(userId);
      expect(fail1User?.verificationAttempts).toBe(1);

      // Second fail attempt
      await request(app.getHttpServer())
        .post('/auth/verify')
        .send({ userId, code: wrongCode, email: userEmail })
        .expect(400);
      
      const fail2User = await userDomainService.getUserById(userId);
      expect(fail2User?.verificationAttempts).toBe(2);

      // Third fail attempt
      await request(app.getHttpServer())
        .post('/auth/verify')
        .send({ userId, code: wrongCode, email: userEmail })
        .expect(400);
      
      const fail3User = await userDomainService.getUserById(userId);
      expect(fail3User?.verificationAttempts).toBe(3);

      // Fourth fail attempt
      await request(app.getHttpServer())
        .post('/auth/verify')
        .send({ userId, code: wrongCode, email: userEmail })
        .expect(400);
      
      const fail4User = await userDomainService.getUserById(userId);
      expect(fail4User?.verificationAttempts).toBe(4);

      // Fifth fail attempt
      const executionDateTime = new Date(Date.now());
      await request(app.getHttpServer())
        .post('/auth/verify')
        .send({ userId, code: wrongCode, email: userEmail })
        .expect(400);
      
      const fail5User = await userDomainService.getUserById(userId);
      expect(fail5User?.verificationAttempts).toBe(5);
      expect(fail5User?.verificationLockedUntil?.getTime()).toBeCloseTo(new Date(executionDateTime.getTime() + 15 * 60 * 1000).getTime(), -100);

      const lockedLoginIntitateResponse = await request(app.getHttpServer()).post('/auth/login')
        .send({ email: userEmail, phoneNumber: '' })
        .expect(403);

      expect(lockedLoginIntitateResponse.body).toEqual(expect.objectContaining({
        errorCode: CoreDomainExceptionCodes.LoginTemporaryLocked,
        message: 'User is temporary locked out of verification',
        statusCode: 403,
      }));
    });
  });
});
