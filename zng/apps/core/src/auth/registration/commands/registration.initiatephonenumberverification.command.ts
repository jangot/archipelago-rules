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
import { RegistrationTransitionResult } from '@library/shared/types';
import { logSafeRegistration, logSafeUser } from '@library/shared/common/helpers';
import { EntityNotFoundException, MissingInputException } from '@library/shared/common/exceptions/domain';
import { ContactTakenException, RegistrationNotFoundException } from '../../../domain/exceptions';

@CommandHandler(InitiatePhoneNumberVerificationCommand)
export class InitiatePhoneNumberVerificationCommandHandler
  extends RegistrationBaseCommandHandler<InitiatePhoneNumberVerificationCommand>
  implements ICommandHandler<InitiatePhoneNumberVerificationCommand> {
  public async execute(command: InitiatePhoneNumberVerificationCommand): Promise<RegistrationTransitionResult> {
    if (!command || !command.payload || !command.payload.input) {
      this.logger.warn('initiatePhoneNumberVerification: Invalid command payload', { command });
      throw new MissingInputException('Invalid command payload');
    }
    const { payload: { id: userId, input } } = command;

    if (!userId) {
      throw new MissingInputException('User id cannot be null when initiating verification of Phone number.');
    }

    const registration = await this.domainServices.userServices.getUserRegistration(userId);

    if (!registration || registration.status !== RegistrationStatus.EmailVerified) {
      this.logger.debug(`No registration found for user ${userId} or registration is in a wrong state`, {
        registration: logSafeRegistration(registration),
      });
      throw new RegistrationNotFoundException('No registration found for user');
    }

    const { phoneNumber } = input;

    if (!phoneNumber) {
      this.logger.warn('No phone number provided for phone number verification', { input });
      throw new MissingInputException('Phone number is missing during phone number verification');
    }

    const userByPhone = await this.domainServices.userServices.getUserByContact(phoneNumber, ContactType.PHONE_NUMBER);

    if (userByPhone) {
      if (userByPhone.id === userId) {
        this.logger.debug(`User ${userId} already has the phone number ${phoneNumber}`);
        throw new ContactTakenException('Phone number already taken by user');
      }
      this.logger.debug(`Phone number already taken: ${phoneNumber} by ${userByPhone.id}`, { input });
      throw new ContactTakenException('Phone number already taken');
    }

    const user = await this.domainServices.userServices.getUserById(registration.userId);
    if (!user) {
      throw new EntityNotFoundException('User not found');
    }

    const { code, expiresAt } = this.domainServices.userServices.generateCode();

    this.logger.debug(`About to update registration during adding phone number for user ${userId}`, {
      user: logSafeUser(user),
      registration: logSafeRegistration(registration),
    });

    registration.secret = code;
    registration.secretExpiresAt = expiresAt;
    registration.status = RegistrationStatus.PhoneNumberVerifying;

    user.pendingPhoneNumber = transformPhoneNumber(phoneNumber);
    user.registrationStatus = RegistrationStatus.PhoneNumberVerifying;

    this.logger.debug('Updated registration and user data before apply', {
      user: logSafeUser(user),
      registration: logSafeRegistration(registration),
    });

    await this.domainServices.userServices.updateUserRegistration(registration, user);

    this.logger.debug(`Updated registration during adding phone number for user ${userId}`);

    this.sendEvent(user, VerificationEvent.PhoneNumberVerifying);

    return this.createTransitionResult(RegistrationStatus.PhoneNumberVerifying, true, userId, undefined, code);
  }
}
