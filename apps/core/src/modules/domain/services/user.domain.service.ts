/*
 * File Name   : user.domain.service.ts
 * Author      : Michael LeDuc
 * Created Date: Sun Mar 16 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { Injectable, Logger } from '@nestjs/common';
import { IApplicationUser, ILogin, IPaymentAccount, IUserRegistration } from '@library/entity/entity-interface';
import { Transactional } from 'typeorm-transactional';
import { DeepPartial } from 'typeorm';
import { ContactType } from '@library/entity/enum';

import { generateSecureCode } from '@library/shared/common/helper';
import { JwtService } from '@nestjs/jwt';
import { IJwtPayload } from '@core/modules/auth/interfaces/ijwt-payload';
import { IRefreshTokenPayload } from '@core/modules/auth/interfaces/irefresh-token-payload';
import { ConfigService } from '@nestjs/config';
import { addSeconds, getUnixTime } from 'date-fns';
import { generateCRC32String } from '@library/shared/common/helper/crc32.helpers';
import { IPaging, PagingOptionsDto } from '@library/shared/common/paging';
import { SearchFilterDto } from '@library/shared/common/search';
import { BaseDomainServices } from '@library/shared/common/domainservice/domain.service.base';
import { CoreDataService } from '@core/modules/data/data.service';
import { PaymentAccountRelation } from '@library/shared/domain/entity/relation';

@Injectable()
export class UserDomainService extends BaseDomainServices {
  protected readonly logger = new Logger(UserDomainService.name);

  constructor(
    protected readonly data: CoreDataService,
    protected readonly jwtService: JwtService,
    protected readonly config: ConfigService
  ) {
    super(data);
  }

  @Transactional()
  public async updateUserRegistration(registration: IUserRegistration, user: IApplicationUser): Promise<void> {
    this.logger.debug(`Updating user registration for user ${user.id}`);

    await Promise.all([this.data.userRegistrations.update(registration.id, registration), this.data.users.update(user.id, user)]);
  }

  //#region User Related Fetches
  @Transactional()
  public async createUserLoginOnRegistration(
    user: IApplicationUser,
    registration: IUserRegistration,
    login: DeepPartial<ILogin> | null
  ): Promise<ILogin | null> {
    this.logger.debug(`Creating login ${login?.loginType || '{already logged in - skipping}'} for user ${user.id}`);

    let loginResult: ILogin | null = null;

    // Need to handle the Login creation here as we need to update the user registration with the loginId
    // If the login is null, it means the user is already logged in and we need to get the loginId from the registration
    if (login) {
      loginResult = await this.data.logins.createOrUpdate(login);
      registration.userLoginId = loginResult?.id || null;
    } else if (registration.userLoginId) {
      loginResult = await this.data.logins.getById(registration.userLoginId);
    }

    await Promise.all([this.data.userRegistrations.update(registration.id, registration), this.data.users.update(user.id, user)]);

    return loginResult;
  }

  public async getUserRegistration(userId: string): Promise<IUserRegistration | null> {
    return this.data.userRegistrations.getByUserId(userId);
  }

  public async getUserById(userId: string): Promise<IApplicationUser | null> {
    return this.data.users.getById(userId);
  }

  public async getUserByContact(contact: string, contactType: ContactType): Promise<IApplicationUser | null> {
    return this.data.users.getUserByContact(contact, contactType);
  }

  public async logoutUser(userId: string, accessToken: string): Promise<void> {
    return this.data.logins.deleteUserLoginsByAccessToken(userId, accessToken);
  }

  //#endregion

  //#region User Related Creation Methods
  public async createNewUser(user: DeepPartial<IApplicationUser>): Promise<IApplicationUser | null> {
    return this.data.users.insert(user, true);
  }

  public async createNewUserRegistration(registration: DeepPartial<IUserRegistration>): Promise<IUserRegistration | null> {
    return this.data.userRegistrations.create(registration);
  }
  //#endregion

  //#region User Related Login Methods
  public async createLogin(login: DeepPartial<ILogin>, shouldHashSecrets = false): Promise<ILogin | null> {
    login = this.applyRequiredHashes(login, shouldHashSecrets);
    return this.data.logins.create(login);
  }

  public async updateLogin(loginId: string, login: DeepPartial<ILogin>, shouldHashSecrets = false): Promise<boolean | null> {
    login = this.applyRequiredHashes(login, shouldHashSecrets);
    return this.data.logins.update(loginId, login);
  }

  public async updateUser(user: IApplicationUser): Promise<boolean | null> {
    return this.data.users.update(user.id, user);
  }

  // #region Login related fetches
  public async getUserLoginByToken(userId: string, token: string, isTokenSecure = false, isAccessToken = false): Promise<ILogin | null> {
    if (!isTokenSecure) {
      token = generateCRC32String(token);
    }

    return this.data.logins.getUserLoginForSecret(userId, token, isAccessToken);
  }

  public async getUserLogins(userId: string): Promise<ILogin[] | null> {
    return this.data.logins.getAllUserLogins(userId);
  }

  public async applyFailedLoginAttempt(user: IApplicationUser): Promise<boolean | null> {
    user.verificationAttempts = user.verificationAttempts + 1;
    const maxAttempts = this.config.getOrThrow<number>('MAX_LOGIN_ATTEMPTS');
    const lockoutDuration = this.config.getOrThrow<number>('LOGIN_LOCKOUT_DURATION');
    if (user.verificationAttempts >= maxAttempts) {
      user.verificationLockedUntil = addSeconds(new Date(Date.now()), lockoutDuration);
    }
    return this.data.users.update(user.id, user);
  }

  public async softDeleteUser(userId: string): Promise<boolean> {
    return this.data.users.softDelete({ id: userId });
  }

  public async restoreUser(userId: string): Promise<boolean> {
    return this.data.users.restore({ id: userId });
  }

  public async searchUsers(filters?: SearchFilterDto[], paging?: PagingOptionsDto): Promise<IPaging<IApplicationUser>> {
    return this.data.users.search(filters, paging);
  }
  //#endregion

  //#region Miscellaneous stuff for now
  public generateCode(): { code: string; expiresAt: Date } {
    const code = generateSecureCode(6);
    // TODO: Get this value from the config
    // For now, we are setting the expiration to 1 hour
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour expiration for now
    return { code, expiresAt };
  }

  public createAccessTokenPayload(userId: string): IJwtPayload {
    const expiration = this.config.getOrThrow<number>('JWT_ACCESS_EXP');
    const exp = getUnixTime(addSeconds(new Date(Date.now()), expiration)); // 1 hour expiration in Unix Epoch time
    const iat = Math.floor(Date.now() / 1000); // Current dateTime in Unix Epoch time
    const payload: IJwtPayload = {
      iss: 'https://auth.zirtue.com',
      sub: userId,
      aud: 'api-zirtue.com',
      exp: exp,
      iat: iat,
      scope: 'read write profile',
      isAdmin: false,
    };

    return payload;
  }

  public createRefreshTokenPayload(userId: string): IRefreshTokenPayload {
    const expiration = this.config.getOrThrow<number>('JWT_REFRESH_EXP');
    const exp = getUnixTime(addSeconds(new Date(Date.now()), expiration)); // 7 days expiration in Unix Epoch time
    const iat = Math.floor(Date.now() / 1000); // Current dateTime in Unix Epoch time
    const payload: IRefreshTokenPayload = { iss: 'https://auth.zirtue.com', sub: userId, aud: 'api-zirtue.com', exp: exp, iat: iat };

    return payload;
  }

  // Make it separate as we need to know exact token type to apply default expiration and secret
  public async generateAccessToken(payload: IJwtPayload, expiresIn?: number): Promise<string> {
    const expiration = expiresIn || this.config.getOrThrow<number>('JWT_ACCESS_EXP');
    const secret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');

    return this.generateToken(payload, expiration, secret);
  }

  public async generateRefreshToken(payload: IRefreshTokenPayload, expiresIn?: number): Promise<string> {
    const expiration = expiresIn || this.config.getOrThrow<number>('JWT_REFRESH_EXP');
    const secret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');

    return this.generateToken(payload, expiration, secret);
  }

  private async generateToken(payload: IJwtPayload | IRefreshTokenPayload, expiresIn: number, secret: string): Promise<string> {
    if (!payload.exp) {
      payload.exp = getUnixTime(addSeconds(new Date(Date.now()), expiresIn));
    }
    return this.jwtService.signAsync(payload, { secret });
  }

  private applyRequiredHashes(login: DeepPartial<ILogin>, shouldHashSecrets = false): DeepPartial<ILogin> {
    const { secret, sessionId } = login;
    return {
      ...login,
      secret: shouldHashSecrets && secret ? generateCRC32String(secret) : secret,
      sessionId: shouldHashSecrets && sessionId ? generateCRC32String(sessionId) : sessionId,
    };
  }

  //#endregion

  // #region Payment Accounts
  public async addPaymentAccount(userId: string, input: DeepPartial<IPaymentAccount>): Promise<IPaymentAccount | null> {
    this.logger.debug(`Adding payment account for user ${userId}`, { input });
    return this.data.paymentAccounts.createPaymentAccount({ ...input, userId: userId });
  }
  
  public async getPaymentAccountById(paymentAccountId: string, relations?: PaymentAccountRelation[]): Promise<IPaymentAccount | null> {
    this.logger.debug(`Fetching payment account by ID ${paymentAccountId}`, relations);
    return this.data.paymentAccounts.getPaymentAccountById(paymentAccountId, relations);
  }
  // #endregion
}
