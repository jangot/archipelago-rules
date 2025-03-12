/*
 * File Name   : registration.initiatephonenumberverification.command.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Mar 11 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { RegistrationTransitionMessage, RegistrationTransitionResultDto } from 'apps/core/src/dto';
import { RegistrationStatus, ContactType, RegistrationType } from '@library/entity/enum';
import { transformPhoneNumber } from '@library/shared/common/data/transformers/phone-number.transformer';
import { generateSecureCode } from '@library/shared/common/helpers';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegistrationBaseCommandHandler } from './registration.base.command-handler';
import { InitiatePhoneNumberVerificationCommand } from './registration.commands';

@CommandHandler(InitiatePhoneNumberVerificationCommand<RegistrationType.Organic>)
export class InitiatePhoneNumberVerificationCommandHandler
  extends RegistrationBaseCommandHandler<
    RegistrationType.Organic,
    InitiatePhoneNumberVerificationCommand<RegistrationType.Organic>
  >
  implements ICommandHandler<InitiatePhoneNumberVerificationCommand<RegistrationType.Organic>>
{
  public async execute(
    command: InitiatePhoneNumberVerificationCommand<RegistrationType.Organic>
  ): Promise<RegistrationTransitionResultDto> {
    if (!command.payload.id) {
      throw new Error('User id cannot be null when initiating verification of Phone number.');
    }

    const registration = await this.getUserRegistration(command.payload.id!);

    if (!registration || registration.status !== RegistrationStatus.EmailVerified) {
      return this.createTransitionResult(
        registration?.status ?? RegistrationStatus.NotRegistered,
        false,
        RegistrationTransitionMessage.NoRegistrationStatusFound
      );
    }

    const { phoneNumber } = command.payload.input!;

    if (!phoneNumber) {
      return this.createTransitionResult(
        RegistrationStatus.EmailVerified,
        false,
        RegistrationTransitionMessage.NoContactProvided
      );
    }

    const userByPhone = await this.data.users.getUserByContact(phoneNumber, ContactType.PHONE_NUMBER);

    if (userByPhone) {
      return this.createTransitionResult(
        RegistrationStatus.NotRegistered,
        false,
        RegistrationTransitionMessage.ContactTaken
      );
    }

    const user = await this.data.users.getUserById(registration.userId);
    if (!user) {
      return this.createTransitionResult(
        RegistrationStatus.EmailVerified,
        false,
        RegistrationTransitionMessage.WrongInput
      );
    }

    const verificationCode = generateSecureCode(6); // Generate new Verification code
    const verificationCodeExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour expiration for now

    registration.secret = verificationCode;
    registration.secretExpiresAt = verificationCodeExpiresAt;
    registration.status = RegistrationStatus.PhoneNumberVerifying;

    user.pendingPhoneNumber = transformPhoneNumber(phoneNumber);
    user.registrationStatus = RegistrationStatus.PhoneNumberVerifying;

    await Promise.all([
      this.data.userRegistrations.update(command.payload.id!, registration),
      this.data.users.update(user.id, user),
    ]);

    return this.createTransitionResult(RegistrationStatus.PhoneNumberVerifying, true, null);
  }
}
