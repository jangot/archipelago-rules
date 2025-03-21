/*
 * File Name   : user.domain.service.ts
 * Author      : Michael LeDuc
 * Created Date: Sun Mar 16 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { Injectable, Logger } from '@nestjs/common';
import { IApplicationUser, ILogin, IUserRegistration } from '@library/entity/interface';
import { Transactional } from 'typeorm-transactional';
import { DeepPartial } from 'typeorm';
import { ContactType, LoginType } from '@library/entity/enum';
import { BaseDomainServices } from './domain.service.base';
import { generateSecureCode } from '@library/shared/common/helpers';
import { JwtService } from '@nestjs/jwt';
import { IDataService } from '../../data/idata.service';
import { IJwtPayload } from '../interfaces/ijwt-payload';
import { IRefreshTokenPayload } from '../interfaces/irefresh-token-payload';
import { ConfigService } from '@nestjs/config';
import { addSeconds, getUnixTime } from 'date-fns';
import { generateCRC32String } from '@library/shared/common/helpers/crc32.helpers';

@Injectable()
export class UserDomainService extends BaseDomainServices {
  protected readonly logger = new Logger(UserDomainService.name);

  constructor(
    protected readonly data: IDataService,
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

  //#endregion

  //#region User Related Creation Methods
  public async createNewUser(user: DeepPartial<IApplicationUser>): Promise<IApplicationUser | null> {
    return this.data.users.create(user);
  }

  public async createNewUserRegistration(registration: DeepPartial<IUserRegistration>): Promise<IUserRegistration | null> {
    return this.data.userRegistrations.create(registration);
  }
  //#endregion

  //#region User Related Login Methods
  public async createLogin(login: DeepPartial<ILogin>, shouldHashSecret = false): Promise<ILogin | null> {
    if (login.secret && shouldHashSecret) {
      login.secret = generateCRC32String(login.secret);
    }
    return this.data.logins.create(login);
  }

  public async createOrUpdateLogin(login: DeepPartial<ILogin>, shouldHashSecret = false): Promise<ILogin | null> {
    if (login.secret && shouldHashSecret) {
      login.secret = generateCRC32String(login.secret);
    }
    return this.data.logins.createOrUpdate(login);
  }

  public async updateLogin(loginId: string, login: DeepPartial<ILogin>, shouldHashSecret = false): Promise<boolean | null> {
    if (login.secret && shouldHashSecret) {
      login.secret = generateCRC32String(login.secret);
    }
    return this.data.logins.update(loginId, login);
  }

  public async updateUser(user: IApplicationUser): Promise<boolean | null> {
    return this.data.users.update(user.id, user);
  }

  // #region Login related fetches
  public async getUserLoginById(loginId: string): Promise<ILogin | null> {
    return this.data.logins.getById(loginId);
  }

  public async getUserLoginByType(userId: string, loginType: LoginType): Promise<ILogin | null> {
    return this.data.logins.getUserLoginByType(userId, loginType);
  }

  public async getCurrentUserLogin(userId: string): Promise<ILogin | null> {
    return this.data.logins.getCurrentUserLogin(userId);
  }

  public async getUserLoginForRefreshToken(userId: string, refreshToken: string): Promise<ILogin | null> {
    const refreshTokenHash = generateCRC32String(refreshToken);

    return this.data.logins.getUserLoginForSecret(userId, refreshTokenHash);
  }

  public async getUserLogins(userId: string): Promise<ILogin[] | null> {
    return this.data.logins.getUserLogins(userId);
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
  //#endregion
}
