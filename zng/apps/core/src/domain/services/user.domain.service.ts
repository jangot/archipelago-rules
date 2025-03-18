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
import { ContactType } from '@library/entity/enum';
import { BaseDomainServices } from './domain.service.base';

@Injectable()
export class UserDomainService extends BaseDomainServices {
  protected readonly logger = new Logger(UserDomainService.name);

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
}
