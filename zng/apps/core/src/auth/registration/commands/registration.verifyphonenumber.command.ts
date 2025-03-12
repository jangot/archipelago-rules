/*
 * File Name   : registration.verifyphonenumber.command.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Mar 11 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { RegistrationTransitionMessage, RegistrationTransitionResultDto } from 'apps/core/src/dto';
import { RegistrationStatus, LoginType, LoginStatus, RegistrationType } from '@library/entity/enum';
import { RegistrationBaseCommandHandler, RegistrationExecuteParams } from './registration.base.command-handler';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { VerificationCompleteCommand, VerifyPhoneNumberCommand } from './registration.commands';

@CommandHandler(VerifyPhoneNumberCommand<RegistrationType.Organic>)
export class VerifyPhoneNumberCommandHandler
  extends RegistrationBaseCommandHandler<RegistrationType.Organic, VerifyPhoneNumberCommand<RegistrationType.Organic>>
  implements ICommandHandler<VerifyPhoneNumberCommand<RegistrationType.Organic>>
{
  public async execute(
    command: VerifyPhoneNumberCommand<RegistrationType.Organic>
  ): Promise<RegistrationTransitionResultDto> {
    if (!command.payload.id) {
      throw new Error('User id cannot be null when verifying Phone number.');
    }

    if (!command.payload.input) {
      throw new Error('input cannot be null when verifying Email.');
    }

    const registration = await this.getUserRegistration(command.payload.id);

    if (!registration || registration.status !== RegistrationStatus.PhoneNumberVerifying) {
      return this.createTransitionResult(
        registration?.status ?? RegistrationStatus.NotRegistered,
        false,
        RegistrationTransitionMessage.NoRegistrationStatusFound
      );
    }

    const { secret, secretExpiresAt } = registration;
    if (!secret) {
      return this.createTransitionResult(registration.status, false, RegistrationTransitionMessage.NoSecretFound);
    }

    if (secretExpiresAt && secretExpiresAt < new Date()) {
      return this.createTransitionResult(registration.status, false, RegistrationTransitionMessage.SecretExpired);
    }

    const { code } = command.payload.input;
    if (secret !== code) {
      return this.createTransitionResult(
        registration.status,
        false,
        RegistrationTransitionMessage.VerificationCodeMismatch
      );
    }

    registration.status = RegistrationStatus.PhoneNumberVerified;
    registration.secret = null;
    registration.secretExpiresAt = null;

    const user = await this.data.users.getUserById(registration.userId);
    if (!user) {
      return this.createTransitionResult(registration.status, false, RegistrationTransitionMessage.WrongInput);
    }
    user.phoneNumber = user.pendingPhoneNumber;
    user.pendingPhoneNumber = null;
    user.registrationStatus = RegistrationStatus.PhoneNumberVerified;

    const phoneLogin = {
      type: LoginType.OneTimeCodePhoneNumber,
      contact: user.phoneNumber,
      userId: user.id,
      loginStatus: LoginStatus.NotLoggedIn,
    };

    await Promise.all([
      this.data.userRegistrations.update(command.payload.id, registration),
      this.data.users.update(user.id, user),
      this.data.logins.create(phoneLogin),
    ]);

    return await this.completeVerification(command.payload);
  }

  private async completeVerification(
    payload: RegistrationExecuteParams<RegistrationType.Organic>
  ): Promise<RegistrationTransitionResultDto> {
    const completeVerificationCommand = new VerificationCompleteCommand(payload);

    const result = await this.commandBus.execute(completeVerificationCommand);

    return result;
  }
}
