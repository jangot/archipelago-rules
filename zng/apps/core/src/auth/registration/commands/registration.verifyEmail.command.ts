/*
 * File Name   : registration.verifyEmail.command.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Mar 11 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { RegistrationTransitionMessage, RegistrationTransitionResultDto } from 'apps/core/src/dto';
import { RegistrationStatus, LoginType, LoginStatus, RegistrationType } from '@library/entity/enum';
import { Transactional } from 'typeorm-transactional';
import { RegistrationBaseCommandHandler } from './registration.base.command-handler';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { VerifyEmailCommand } from './registration.commands';

@CommandHandler(VerifyEmailCommand)
export class VerifyEmailCommandHandler
  extends RegistrationBaseCommandHandler<RegistrationType.Organic, VerifyEmailCommand>
  implements ICommandHandler<VerifyEmailCommand>
{
  @Transactional()
  public async execute(command: VerifyEmailCommand): Promise<RegistrationTransitionResultDto> {
    if (!command.payload.id) {
      throw new Error('User id cannot be null when verifying Email.');
    }

    const registration = await this.getUserRegistration(command.payload.id);

    if (!registration || registration.status !== RegistrationStatus.EmailVerifying) {
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

    const { code } = command.payload.input!;
    if (secret !== code) {
      return this.createTransitionResult(
        registration.status,
        false,
        RegistrationTransitionMessage.VerificationCodeMismatch
      );
    }

    registration.status = RegistrationStatus.EmailVerified;
    registration.secret = null;
    registration.secretExpiresAt = null;

    const user = await this.data.users.getUserById(registration.userId);
    if (!user) {
      return this.createTransitionResult(registration.status, false, RegistrationTransitionMessage.WrongInput);
    }
    user.email = user.pendingEmail;
    user.pendingEmail = null;
    user.registrationStatus = RegistrationStatus.EmailVerified;

    const emailLogin = {
      type: LoginType.OneTimeCodeEmail,
      contact: user.email,
      userId: user.id,
      loginStatus: LoginStatus.NotLoggedIn,
    };

    await Promise.all([
      this.data.userRegistrations.update(command.payload.id, registration),
      this.data.users.update(user.id, user),
      this.data.logins.create(emailLogin),
    ]);

    return this.createTransitionResult(RegistrationStatus.EmailVerified, true, null);
  }
}
