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

@CommandHandler(VerificationCompleteCommand)
export class VerificationCompleteCommandHandler
  extends RegistrationBaseCommandHandler<VerificationCompleteCommand>
  implements ICommandHandler<VerificationCompleteCommand>
{
  public async execute(command: VerificationCompleteCommand): Promise<RegistrationTransitionResult> {
    if (!command.payload.id) {
      throw new Error('User id cannot be null when completing verification.');
    }
    return await this.completeVerification(command.payload.id);
  }

  @Transactional()
  private async completeVerification(id: string): Promise<RegistrationTransitionResult> {
    const user = await this.domainServices.userServices.getUserById(id);
    const registration = await this.domainServices.userServices.getUserRegistration(id);

    if (!user || !registration) {
      return this.createTransitionResult(
        RegistrationStatus.PhoneNumberVerified,
        false,
        RegistrationTransitionMessage.WrongInput
      );
    }

    const { registrationStatus } = user;
    const { status } = registration;

    if (
      registrationStatus !== RegistrationStatus.PhoneNumberVerified ||
      status !== RegistrationStatus.PhoneNumberVerified
    ) {
      return this.createTransitionResult(
        RegistrationStatus.PhoneNumberVerified,
        false,
        RegistrationTransitionMessage.VerificationCouldNotBeCompleted
      );
    }

    this.logger.debug(`About to update registration and user during registration completion for user ${user.id}`, {
      user,
      registration: { ...registration, secret: '***' },
    });

    user.registrationStatus = RegistrationStatus.Registered;
    registration.status = RegistrationStatus.Registered;

    this.logger.debug(`Updated registration and user data before apply`, {
      user,
      registration: { ...registration, secret: '***' },
    });

    await this.domainServices.userServices.updateUserRegistration(registration, user);

    this.logger.debug(`Updated registration and user data for user ${user.id}`);

    this.sendEvent(user, VerificationEvent.Verified);

    return this.createTransitionResult(RegistrationStatus.Registered, true, null);
  }
}
