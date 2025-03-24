/*
 * File Name   : registration.completeverification.command.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Mar 11 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { RegistrationStatus } from '@library/entity/enum';
import { Transactional } from 'typeorm-transactional';
import { RegistrationBaseCommandHandler } from './registration.base.command-handler';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { VerificationCompleteCommand } from './registration.commands';
import { VerificationEvent } from '../../verification';
import { RegistrationTransitionMessage, RegistrationTransitionResult } from '@library/shared/types';
import { logSafeRegistration, logSafeUser } from '@library/shared/common/helpers';

@CommandHandler(VerificationCompleteCommand)
export class VerificationCompleteCommandHandler
  extends RegistrationBaseCommandHandler<VerificationCompleteCommand>
  implements ICommandHandler<VerificationCompleteCommand>
{
  public async execute(command: VerificationCompleteCommand): Promise<RegistrationTransitionResult> {
    if (!command || !command.payload || !command.payload.input) {
      this.logger.warn(`completeVerification: Invalid command payload`, { command });
      return this.createTransitionResult(RegistrationStatus.NotRegistered, false, RegistrationTransitionMessage.WrongInput);
    }
    const {
      payload: { id },
    } = command;
    if (!id) {
      throw new Error('User id cannot be null when completing verification.');
    }
    return await this.completeVerification(id);
  }

  @Transactional()
  private async completeVerification(id: string): Promise<RegistrationTransitionResult> {
    const user = await this.domainServices.userServices.getUserById(id);
    const registration = await this.domainServices.userServices.getUserRegistration(id);

    if (!user || !registration) {
      this.logger.error(`No user or registration found for user ${id}`);
      return this.createTransitionResult(RegistrationStatus.PhoneNumberVerified, false, RegistrationTransitionMessage.WrongInput);
    }

    const { registrationStatus } = user;
    const { status } = registration;

    if (registrationStatus !== RegistrationStatus.PhoneNumberVerified || status !== RegistrationStatus.PhoneNumberVerified) {
      this.logger.warn(`User ${id} is not in a state to complete verification`, {
        user: logSafeUser(user),
        registration: logSafeRegistration(registration),
      });
      return this.createTransitionResult(
        RegistrationStatus.PhoneNumberVerified,
        false,
        RegistrationTransitionMessage.VerificationCouldNotBeCompleted
      );
    }

    this.logger.debug(`About to update registration and user during registration completion for user ${user.id}`, {
      user: logSafeUser(user),
      registration: logSafeRegistration(registration),
    });

    user.registrationStatus = RegistrationStatus.Registered;
    registration.status = RegistrationStatus.Registered;
    registration.userLoginId = null;
    this.logger.debug(`Updated registration and user data before apply`, {
      user: logSafeUser(user),
      registration: logSafeRegistration(registration),
    });

    await this.domainServices.userServices.updateUserRegistration(registration, user);

    this.logger.debug(`Updated registration and user data for user ${user.id}`);

    this.sendEvent(user, VerificationEvent.Verified);

    return this.createTransitionResult(RegistrationStatus.Registered, true, null);
  }
}
