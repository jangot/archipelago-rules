/*
 * File Name   : registration.completeverification.command.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Mar 11 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { RegistrationTransitionMessage, RegistrationTransitionResultDto } from 'apps/core/src/dto';
import { RegistrationStatus, RegistrationType } from '@library/entity/enum';
import { Transactional } from 'typeorm-transactional';
import { RegistrationBaseCommandHandler } from './registration.base.command-handler';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { VerificationCompleteCommand } from './registration.commands';

@CommandHandler(VerificationCompleteCommand)
export class VerificationCompleteCommandHandler
  extends RegistrationBaseCommandHandler<RegistrationType.Organic, VerificationCompleteCommand>
  implements ICommandHandler<VerificationCompleteCommand>
{
  public async execute(command: VerificationCompleteCommand): Promise<RegistrationTransitionResultDto> {
    if (!command.payload.id) {
      throw new Error('User id cannot be null when completing verification.');
    }
    return await this.completeVerification(command.payload.id);
  }

  @Transactional()
  private async completeVerification(id: string): Promise<RegistrationTransitionResultDto> {
    const user = await this.data.users.getUserById(id);
    const registration = await this.getUserRegistration(id);

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

    user.registrationStatus = RegistrationStatus.Registered;
    registration.status = RegistrationStatus.Registered;

    await Promise.all([this.data.users.update(user.id, user), this.data.userRegistrations.update(id, registration)]);

    return this.createTransitionResult(RegistrationStatus.Registered, true, null);
  }
}
