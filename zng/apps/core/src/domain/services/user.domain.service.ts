/*
 * File Name   : user.domain.service.ts
 * Author      : Michael LeDuc
 * Created Date: Sun Mar 16 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { Injectable, Logger } from '@nestjs/common';
import { IDataService } from '../../data/idata.service';
import { IApplicationUser, IUserRegistration } from '@library/entity/interface';
import { Transactional } from 'typeorm-transactional';

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
}
