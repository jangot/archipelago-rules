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

@Injectable()
export class UserDomainService extends BaseDomainServices {
  protected readonly logger = new Logger(UserDomainService.name);

  constructor(
    protected readonly data: IDataService,
    protected readonly jwtService: JwtService
  ) {
    super(data);
  }

  @Transactional()
  public async updateUserRegistration(registration: IUserRegistration, user: IApplicationUser): Promise<void> {
    this.logger.debug(`Updating user registration for user ${user.id}`);

    await Promise.all([
      this.data.userRegistrations.update(registration.id, registration),
      this.data.users.update(user.id, user),
    ]);
  }

  //#region User Related Fetches
  @Transactional()
  public async createUserLoginOnRegistration(
    user: IApplicationUser,
    registration: IUserRegistration,
    login: DeepPartial<ILogin> | null
  ): Promise<void> {
    this.logger.debug(`Creating login ${login?.loginType || '{already logged in - skipping}'} for user ${user.id}`);

    await Promise.all([
      this.data.userRegistrations.update(registration.id, registration),
      this.data.users.update(user.id, user),
      // Conditionally create or update the login
      login ? this.data.logins.createOrUpdate(login) : Promise.resolve(),
    ]);
  }

  public async getUserRegistration(userId: string): Promise<IUserRegistration | null> {
    return this.data.userRegistrations.getByUserId(userId);
  }

  public async getUserById(userId: string): Promise<IApplicationUser | null> {
    return this.data.users.getUserById(userId);
  }

  public async getUserByContact(contact: string, contactType: ContactType): Promise<IApplicationUser | null> {
    return this.data.users.getUserByContact(contact, contactType);
  }

  //#endregion

  //#region User Related Creation Methods
  public async createNewUser(user: DeepPartial<IApplicationUser>): Promise<IApplicationUser | null> {
    return this.data.users.create(user);
  }

  public async createNewUserRegistration(
    registration: DeepPartial<IUserRegistration>
  ): Promise<IUserRegistration | null> {
    return this.data.userRegistrations.create(registration);
  }
  //#endregion

  //#region User Related Login Methods
  public async createOrUpdateLogin(login: DeepPartial<ILogin>): Promise<ILogin | null> {
    return this.data.logins.createOrUpdate(login);
  }

  public async updateLogin(loginId: string, login: DeepPartial<ILogin>): Promise<boolean | null> {
    return this.data.logins.update(loginId, login);
  }

  // #region Login related fetches
  public async getUserLoginByType(userId: string, loginType: LoginType): Promise<ILogin | null> {
    return this.data.logins.getUserLoginByType(userId, loginType);
  }

  public async getCurrentUserLogin(userId: string): Promise<ILogin | null> {
    return this.data.logins.getCurrentUserLogin(userId);
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
    // TODO: Get expiresIn from the config
    const exp = Math.floor((Date.now() + 3600000) / 1000); // 1 hour expiration in Unix Epoch time
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
    // TODO: Get expiresIn from the config
    const exp = Math.floor((Date.now() + 604800000) / 1000); // 7 days expiration in Unix Epoch time
    const iat = Math.floor(Date.now() / 1000); // Current dateTime in Unix Epoch time
    const payload: IRefreshTokenPayload = {
      iss: 'https://auth.zirtue.com',
      sub: userId,
      aud: 'api-zirtue.com',
      exp: exp,
      iat: iat,
    };

    return payload;
  }

  public async generateToken(payload: IJwtPayload | IRefreshTokenPayload, expiresIn?: string): Promise<string> {
    // Default to 1 hour unless we override this
    if (!expiresIn) {
      expiresIn = '1h';
    }

    const accessToken = await this.jwtService.signAsync(payload, { expiresIn });

    return accessToken;
  }
  //#endregion
}
