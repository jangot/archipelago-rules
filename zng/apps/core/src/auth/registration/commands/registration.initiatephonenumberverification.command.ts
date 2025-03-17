/*
 * File Name   : registration.initiatephonenumberverification.command.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Mar 11 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { RegistrationStatus, ContactType } from '@library/entity/enum';
import { transformPhoneNumber } from '@library/shared/common/data/transformers/phone-number.transformer';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegistrationBaseCommandHandler } from './registration.base.command-handler';
import { InitiatePhoneNumberVerificationCommand } from './registration.commands';
import { VerificationEvent } from '../../verification';
import { RegistrationTransitionMessage, RegistrationTransitionResult } from '@library/shared/types';

@CommandHandler(InitiatePhoneNumberVerificationCommand)
export class InitiatePhoneNumberVerificationCommandHandler
  extends RegistrationBaseCommandHandler<InitiatePhoneNumberVerificationCommand>
  implements ICommandHandler<InitiatePhoneNumberVerificationCommand>
{
  public async execute(command: InitiatePhoneNumberVerificationCommand): Promise<RegistrationTransitionResult> {
    const {
      payload: { id: userId, input },
    } = command;

    if (!userId) {
      throw new Error('User id cannot be null when initiating verification of Phone number.');
    }

    const registration = await this.getUserRegistration(userId);

    if (!registration || registration.status !== RegistrationStatus.EmailVerified) {
      return this.createTransitionResult(
        registration?.status ?? RegistrationStatus.NotRegistered,
        false,
        RegistrationTransitionMessage.NoRegistrationStatusFound
      );
    }

    const { phoneNumber } = input!;

    if (!phoneNumber) {
      return this.createTransitionResult(
        RegistrationStatus.EmailVerified,
        false,
        RegistrationTransitionMessage.NoContactProvided
      );
    }

    const userByPhone = await this.data.users.getUserByContact(phoneNumber, ContactType.PHONE_NUMBER);

    if (userByPhone) {
      if (userByPhone.id === userId) {
        return this.createTransitionResult(
          RegistrationStatus.PhoneNumberVerified,
          false,
          RegistrationTransitionMessage.AlreadyVerified
        );
      }
      return this.createTransitionResult(
        RegistrationStatus.PhoneNumberVerifying,
        false,
        RegistrationTransitionMessage.ContactTaken
      );
    }

    const user = await this.data.users.getUserById(registration.userId);
    if (!user) {
      return this.createTransitionResult(
        RegistrationStatus.PhoneNumberVerifying,
        false,
        RegistrationTransitionMessage.WrongInput
      );
    }

    const { code: verificationCode, expiresAt: verificationCodeExpiresAt } = this.generateCode();
    this.logger.debug(`About to update registration during adding phone number for user ${userId}`, {
      user,
      registration: { ...registration, secret: '***' },
    });

    registration.secret = verificationCode;
    registration.secretExpiresAt = verificationCodeExpiresAt;
    registration.status = RegistrationStatus.PhoneNumberVerifying;

    user.pendingPhoneNumber = transformPhoneNumber(phoneNumber);
    user.registrationStatus = RegistrationStatus.PhoneNumberVerifying;

    this.logger.debug(`Updated registration and user data before apply`, {
      user,
      registration: { ...registration, secret: '***' },
    });

    await this.domainServices.userServices.updateUserRegistration(registration, user);

    this.logger.debug(`Updated registration during adding phone number for user ${userId}`);

    this.sendEvent(user, VerificationEvent.PhoneNumberVerifying);

    return this.createTransitionResult(RegistrationStatus.PhoneNumberVerifying, true, null, userId, verificationCode);
  }
}
