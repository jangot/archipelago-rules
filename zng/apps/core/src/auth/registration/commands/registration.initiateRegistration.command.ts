/*
 * File Name   : registration.initiateRegistration.command.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Mar 11 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { ContactType, RegistrationStatus, RegistrationType } from '@library/entity/enum';
import { generateSecureCode } from '@library/shared/common/helpers';
import { RegistrationTransitionMessage, RegistrationTransitionResultDto } from 'apps/core/src/dto';
import { RegistrationBaseCommandHandler } from './registration.base.command-handler';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegistrationInitiatedCommand } from './registration.commands';

@CommandHandler(RegistrationInitiatedCommand<RegistrationType.Organic>)
export class RegistrationInitiatedCommandHandler
  extends RegistrationBaseCommandHandler<
    RegistrationType.Organic,
    RegistrationInitiatedCommand<RegistrationType.Organic>
  >
  implements ICommandHandler<RegistrationInitiatedCommand<RegistrationType.Organic>>
{
  public async execute(
    command: RegistrationInitiatedCommand<RegistrationType.Organic>
  ): Promise<RegistrationTransitionResultDto> {
    const { firstName, lastName, email } = command.payload.input!;

    if (!email) {
      return this.createTransitionResult(
        RegistrationStatus.NotRegistered,
        false,
        RegistrationTransitionMessage.NoContactProvided
      );
    }

    const userByEmail = await this.data.users.getUserByContact(email, ContactType.EMAIL);

    if (userByEmail) {
      return this.createTransitionResult(
        RegistrationStatus.NotRegistered,
        false,
        RegistrationTransitionMessage.ContactTaken
      );
    }

    const verificationCode = generateSecureCode(6); // Generate new Verification code
    const verificationCodeExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour expiration for now

    const newUser = {
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      pendingEmail: email,
      registrationStatus: RegistrationStatus.EmailVerifying,
    };

    // Create the barebones User here
    const user = await this.data.users.create(newUser);
    const { id: userId } = user;
    const newUserRegistration = {
      userId,
      status: RegistrationStatus.EmailVerifying,
      secret: verificationCode,
      secretExpiresAt: verificationCodeExpiresAt,
    };
    // Create User Registration and store verification code with expiration date
    const userRegistration = await this.data.userRegistrations.create(newUserRegistration);
    this.logger.debug(`initiateRegistration: Registering user: ${email}`, {
      user,
      userRegistration: { ...userRegistration, secret: null },
    });

    return this.createTransitionResult(RegistrationStatus.EmailVerifying, true, null, userId, verificationCode);
  }
}
