/*
 * File Name   : index.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Mar 11 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { VerificationCompleteCommandHandler } from './registration.completeverification.command';
import { InitiateEmailVerificationCommandHandler } from './registration.initiateemailverification.command';
import { InitiatePhoneNumberVerificationCommandHandler } from './registration.initiatephonenumberverification.command';
import { RegistrationInitiatedCommandHandler } from './registration.initiateRegistration.command';
import { VerifyContactCommandHandler } from './registration.verifycontact.command';

export const RegistrationCommandHandlers = [
  RegistrationInitiatedCommandHandler,
  InitiateEmailVerificationCommandHandler,
  InitiatePhoneNumberVerificationCommandHandler,
  VerificationCompleteCommandHandler,
  VerifyContactCommandHandler,
  // Insert Command Handler Here
];

export * from './registration.commands';
