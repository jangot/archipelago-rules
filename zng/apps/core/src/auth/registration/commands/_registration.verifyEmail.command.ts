/*
 * File Name   : registration.verifyEmail.command.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Mar 11 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { RegistrationTransitionMessage, RegistrationTransitionResultDto } from 'apps/core/src/dto';
import { RegistrationStatus, LoginType, LoginStatus } from '@library/entity/enum';
import { Transactional } from 'typeorm-transactional';
import { RegistrationBaseCommandHandler } from './registration.base.command-handler';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { VerifyEmailCommand } from './registration.commands';
import { UserRegistration, ApplicationUser, Login } from '../../../data/entity';
import { DeepPartial } from 'typeorm';

@CommandHandler(VerifyEmailCommand)
export class VerifyEmailCommandHandler
  extends RegistrationBaseCommandHandler<VerifyEmailCommand>
  implements ICommandHandler<VerifyEmailCommand>
{
  @Transactional()
  public async execute(command: VerifyEmailCommand): Promise<RegistrationTransitionResultDto> {
    if (!command.payload.id) {
      throw new Error('User id cannot be null when verifying Email.');
    }

    if (!command.payload.input) {
      throw new Error('input cannot be null when verifying Email.');
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

    const { code } = command.payload.input;
    if (secret !== code) {
      return this.createTransitionResult(
        registration.status,
        false,
        RegistrationTransitionMessage.VerificationCodeMismatch
      );
    }

    const user = await this.data.users.getUserById(registration.userId);
    if (!user) {
      return this.createTransitionResult(registration.status, false, RegistrationTransitionMessage.WrongInput);
    }

    const emailLogin = {
      loginType: LoginType.OneTimeCodeEmail,
      userId: user.id,
      loginStatus: LoginStatus.NotLoggedIn,
    };

    this.logger.debug(`About to update registration, user and add login during adding email for user ${user.id}`, {
      user,
      registration: { ...registration, secret: '***' },
      login: emailLogin,
    });

    registration.status = RegistrationStatus.EmailVerified;
    registration.secret = null;
    registration.secretExpiresAt = null;

    user.email = user.pendingEmail;
    user.pendingEmail = null;
    user.registrationStatus = RegistrationStatus.EmailVerified;

    this.logger.debug(`Updated registration, user and add login data before apply`, {
      user,
      registration: { ...registration, secret: '***' },
      login: emailLogin,
    });

    await this.updateData(registration, user, emailLogin);

    this.logger.debug(`Updated registration, user and add login for user ${user.id}`);

    return this.createTransitionResult(RegistrationStatus.EmailVerified, true, null);
  }

  @Transactional()
  private async updateData(
    registration: UserRegistration,
    user: ApplicationUser,
    login: DeepPartial<Login>
  ): Promise<void> {
    await Promise.all([
      this.data.userRegistrations.update(registration.id, registration),
      this.data.users.update(user.id, user),
      this.data.logins.createOrUpdate(login),
    ]);
  }
}
