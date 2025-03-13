/*
 * File Name   : registration.commands.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Mar 11 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { RegistrationExecuteParams } from './registration.base.command-handler';

export class RegistrationBaseCommand {
  constructor(public readonly payload: RegistrationExecuteParams) {}
}

export class RegistrationInitiatedCommand extends RegistrationBaseCommand {}
export class VerifyEmailCommand extends RegistrationBaseCommand {}

export class InitiatePhoneNumberVerificationCommand extends RegistrationBaseCommand {}
export class VerifyPhoneNumberCommand extends RegistrationBaseCommand {}

export class VerificationCompleteCommand extends RegistrationBaseCommand {}
