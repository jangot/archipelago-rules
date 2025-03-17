/*
 * File Name   : user.domain.service.ts
 * Author      : Michael LeDuc
 * Created Date: Sun Mar 16 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { Injectable, Logger } from '@nestjs/common';
import { IDataService } from '../../data/idata.service';
import { IApplicationUser, ILogin, IUserRegistration } from '@library/entity/interface';
import { Transactional } from 'typeorm-transactional';
import { DeepPartial } from 'typeorm';

@Injectable()
export class UserDomainService {
  protected readonly logger = new Logger(UserDomainService.name);

  constructor(protected readonly data: IDataService) {}

  @Transactional()
  public async updateUserRegistration(registration: IUserRegistration, user: IApplicationUser): Promise<void> {
    this.logger.debug(`Updating user registration for user ${user.id}`);

    await Promise.all([
      this.data.userRegistrations.update(registration.id, registration),
      this.data.users.update(user.id, user),
    ]);
  }

  @Transactional()
  public async createUserLoginOnRegistration(
    user: IApplicationUser,
    registration: IUserRegistration,
    login: DeepPartial<ILogin>
  ): Promise<void> {
    this.logger.debug(`Creating login ${login.loginType} for user ${user.id}`);

    await Promise.all([
      this.data.userRegistrations.update(registration.id, registration),
      this.data.users.update(user.id, user),
      this.data.logins.createOrUpdate(login),
    ]);
  }
}
