/*
 * File Name   : registration.commands.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Mar 11 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { RegistrationType } from '@library/entity/enum';
import { RegistrationExecuteParams } from './registration.base.command-handler';

export class RegistrationBaseCommand<Type extends RegistrationType = RegistrationType> {
  constructor(public readonly payload: RegistrationExecuteParams<Type>) {}
}

export class RegistrationInitiatedCommand extends RegistrationBaseCommand<RegistrationType.Organic> {}

export class VerifyEmailCommand extends RegistrationBaseCommand<RegistrationType.Organic> {}

export class InitiatePhoneNumberVerificationCommand extends RegistrationBaseCommand<RegistrationType.Organic> {}

export class VerifyPhoneNumberCommand extends RegistrationBaseCommand<RegistrationType.Organic> {}

export class VerificationCompleteCommand extends RegistrationBaseCommand<RegistrationType.Organic> {}
