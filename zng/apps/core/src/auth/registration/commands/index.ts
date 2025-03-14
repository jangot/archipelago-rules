/*
 * File Name   : index.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Mar 11 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { VerificationCompleteCommandHandler } from './registration.completeverification.command';
import { InitiatePhoneNumberVerificationCommandHandler } from './registration.initiatephonenumberverification.command';
import { RegistrationInitiatedCommandHandler } from './registration.initiateRegistration.command';
import { VerificationCodeResendCommandHandler } from './_registration.verificationcoderesend.command';
import { VerifyContactCommandHandler } from './registration.verifycontact.command';
import { VerifyEmailCommandHandler } from './_registration.verifyEmail.command';
import { VerifyPhoneNumberCommandHandler } from './_registration.verifyphonenumber.command';

export const CommandHandlers = [
  RegistrationInitiatedCommandHandler,
  VerifyEmailCommandHandler,
  InitiatePhoneNumberVerificationCommandHandler,
  VerifyPhoneNumberCommandHandler,
  VerificationCompleteCommandHandler,
  VerificationCodeResendCommandHandler,
  VerifyContactCommandHandler,
  // Insert Command Handler Here
];

export * from './registration.commands';
