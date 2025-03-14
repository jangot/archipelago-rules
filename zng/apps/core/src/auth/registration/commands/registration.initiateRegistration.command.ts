/*
 * File Name   : registration.initiateRegistration.command.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Mar 11 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { ContactType, RegistrationStatus } from '@library/entity/enum';
import { generateSecureCode } from '@library/shared/common/helpers';
import { RegistrationDto, RegistrationTransitionMessage, RegistrationTransitionResultDto } from '../../../dto';
import { RegistrationBaseCommandHandler } from './registration.base.command-handler';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegistrationInitiatedCommand } from './registration.commands';
import { ApplicationUser, UserRegistration } from '../../../data/entity';
import { Transactional } from 'typeorm-transactional';
import { VerificationEvent } from '../../verification';

@CommandHandler(RegistrationInitiatedCommand)
export class RegistrationInitiatedCommandHandler
  extends RegistrationBaseCommandHandler<RegistrationInitiatedCommand>
  implements ICommandHandler<RegistrationInitiatedCommand>
{
  public async execute(command: RegistrationInitiatedCommand): Promise<RegistrationTransitionResultDto> {
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

    // Check if the user already exists but only has a pending email
    const pendingUser = await this.data.users.getUserByContact(email, ContactType.PENDING_EMAIL);
    if (pendingUser) {
      return this.reInitiateEmailVerification(pendingUser, command.payload.input!);
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
    const user = await this.data.users.insert(newUser, true);
    if (!user) {
      this.logger.error(`initiateRegistration: Failed to create user: ${email}`, { newUser });
      return this.createTransitionResult(
        RegistrationStatus.NotRegistered,
        false,
        RegistrationTransitionMessage.CouldNotCreateUser
      );
    }
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

    this.sendEvent(user, VerificationEvent.EmailVerifying);

    return this.createTransitionResult(RegistrationStatus.EmailVerifying, true, null, userId, verificationCode);
  }

  private async reInitiateEmailVerification(
    user: ApplicationUser,
    input: RegistrationDto
  ): Promise<RegistrationTransitionResultDto> {
    const { firstName, lastName, email } = input;

    const registration = await this.getUserRegistration(user.id);
    if (!registration) {
      return this.createTransitionResult(
        RegistrationStatus.EmailVerifying,
        false,
        RegistrationTransitionMessage.NoRegistrationStatusFound
      );
    }

    const verificationCode = generateSecureCode(6); // Generate new Verification code
    const verificationCodeExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour expiration for now

    this.logger.debug(`About to update registration during adding email for user ${user.id}`, {
      user,
      registration: { ...registration, secret: '***' },
    });

    registration.secret = verificationCode;
    registration.secretExpiresAt = verificationCodeExpiresAt;
    registration.status = RegistrationStatus.EmailVerifying;

    user.pendingEmail = email!;
    user.email = null;
    user.firstName = firstName?.trim() || user.firstName;
    user.lastName = lastName?.trim() || user.lastName;
    user.registrationStatus = RegistrationStatus.EmailVerifying;

    this.logger.debug(`Updated registration and user data before apply`, {
      user,
      registration: { ...registration, secret: '***' },
    });

    await this.updateData(registration, user);

    this.logger.debug(`Updated registration during adding email for user ${user.id}`);

    this.sendEvent(user, VerificationEvent.EmailCodeResent);

    return this.createTransitionResult(RegistrationStatus.EmailVerifying, true, null, user.id, verificationCode);
  }

  @Transactional()
  private async updateData(registration: UserRegistration, user: ApplicationUser): Promise<void> {
    await Promise.all([
      this.data.userRegistrations.update(registration.id, registration),
      this.data.users.update(user.id, user),
    ]);
  }
}
