/*
 * File Name   : registration.initiateRegistration.command.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Mar 11 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { ContactType, RegistrationStatus } from '@library/entity/enum';
import { RegistrationDto } from '../../../dto';
import { RegistrationBaseCommandHandler } from './registration.base.command-handler';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegistrationInitiatedCommand } from './registration.commands';
import { VerificationEvent } from '../../verification';
import { IApplicationUser } from '@library/entity/interface';
import { RegistrationTransitionMessage, RegistrationTransitionResult } from '@library/shared/types';
import { logSafeRegistration, logSafeUser, safeTrim } from '@library/shared/common/helpers';

@CommandHandler(RegistrationInitiatedCommand)
export class RegistrationInitiatedCommandHandler
  extends RegistrationBaseCommandHandler<RegistrationInitiatedCommand>
  implements ICommandHandler<RegistrationInitiatedCommand>
{
  public async execute(command: RegistrationInitiatedCommand): Promise<RegistrationTransitionResult> {
    if (!command || !command.payload || !command.payload.input) {
      this.logger.warn(`initiateRegistration: Invalid command payload`, { command });
      return this.createTransitionResult(
        RegistrationStatus.NotRegistered,
        false,
        RegistrationTransitionMessage.WrongInput
      );
    }

    const {
      payload: { input },
    } = command;
    const { firstName, lastName, email } = input;

    if (!email) {
      this.logger.warn(`initiateRegistration: No email provided`, { input });
      return this.createTransitionResult(
        RegistrationStatus.NotRegistered,
        false,
        RegistrationTransitionMessage.NoContactProvided
      );
    }

    // Check if provided email is already taken by a registered user
    const userByEmail = await this.domainServices.userServices.getUserByContact(email, ContactType.EMAIL);
    if (userByEmail) {
      this.logger.debug(`initiateRegistration: Email already taken: ${email} by ${userByEmail.id}`, { input });
      return this.createTransitionResult(
        RegistrationStatus.NotRegistered,
        false,
        RegistrationTransitionMessage.ContactTaken
      );
    }

    // Check if the user already exists but only has a pending email
    // If such user found, re-initiate the email verification process
    const pendingUser = await this.domainServices.userServices.getUserByContact(email, ContactType.PENDING_EMAIL);
    if (pendingUser) {
      this.logger.debug(`initiateRegistration: Pending user found: ${email} by ${pendingUser.id}`, { input });
      return this.reInitiateEmailVerification(pendingUser, input);
    }

    const { code, expiresAt } = this.domainServices.userServices.generateCode();

    const newUser = {
      firstName: safeTrim(firstName),
      lastName: safeTrim(lastName),
      pendingEmail: email,
      registrationStatus: RegistrationStatus.EmailVerifying,
    };

    // Create the barebones User here
    const user = await this.domainServices.userServices.createNewUser(newUser);
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
      secret: code,
      secretExpiresAt: expiresAt,
    };

    // Create User Registration and store verification code with expiration date
    const userRegistration = await this.domainServices.userServices.createNewUserRegistration(newUserRegistration);
    this.logger.debug(`initiateRegistration: Registering user: ${email}`, {
      user: logSafeUser(user),
      registration: logSafeRegistration(userRegistration),
    });

    this.sendEvent(user, VerificationEvent.EmailVerifying);

    return this.createTransitionResult(RegistrationStatus.EmailVerifying, true, null, userId, code);
  }

  private async reInitiateEmailVerification(
    user: IApplicationUser,
    input: RegistrationDto
  ): Promise<RegistrationTransitionResult> {
    const { firstName, lastName, email } = input;

    // This case is unexpected as we re-initiate email verification only by not empty email
    // Do this validation to tell TS that this field is 100% not empty
    if (!email) {
      this.logger.error(`Email is missing during re-initiation of email verification for user ${user.id}`, {
        user: logSafeUser(user),
      });
      throw new Error('Email is missing during re-initiation of email verification');
    }

    const registration = await this.domainServices.userServices.getUserRegistration(user.id);
    if (!registration) {
      this.logger.warn(
        `reInitiateEmailVerification: No registration found for user ${user.id} while ${email} is found as pending`,
        { user: logSafeUser(user) }
      );
      return this.createTransitionResult(
        RegistrationStatus.EmailVerifying,
        false,
        RegistrationTransitionMessage.NoRegistrationStatusFound
      );
    }

    const { code, expiresAt } = this.domainServices.userServices.generateCode();

    this.logger.debug(`About to update registration during re-initiation of email verification for user ${user.id}`, {
      user: logSafeUser(user),
      registration: logSafeRegistration(registration),
    });

    registration.secret = code;
    registration.secretExpiresAt = expiresAt;
    registration.status = RegistrationStatus.EmailVerifying;

    user.pendingEmail = email;
    user.email = null;
    user.firstName = safeTrim(firstName) || user.firstName;
    user.lastName = safeTrim(lastName) || user.lastName;
    user.registrationStatus = RegistrationStatus.EmailVerifying;

    this.logger.debug(`Updated registration and user data before apply`, {
      user: logSafeUser(user),
      registration: logSafeRegistration(registration),
    });

    await this.domainServices.userServices.updateUserRegistration(registration, user);
    this.logger.debug(`Updated registration during adding email for user ${user.id}`);

    this.sendEvent(user, VerificationEvent.EmailCodeResent);

    return this.createTransitionResult(RegistrationStatus.EmailVerifying, true, null, user.id, code);
  }
}
