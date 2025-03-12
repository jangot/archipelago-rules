/*
 * File Name   : registration.commands.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Mar 11 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { RegistrationType } from '@library/entity/enum';
import { RegistrationExecuteParams } from './registration.base.command-handler';

export class RegistrationBaseCommand<Type extends RegistrationType> {
  constructor(public readonly payload: RegistrationExecuteParams<Type>) {}
}

export class RegistrationInitiatedCommand<
  T extends RegistrationType = RegistrationType,
> extends RegistrationBaseCommand<T> {}

export class VerifyEmailCommand<T extends RegistrationType = RegistrationType> extends RegistrationBaseCommand<T> {}
export class InitiatePhoneNumberVerificationCommand<
  T extends RegistrationType = RegistrationType,
> extends RegistrationBaseCommand<T> {}

export class VerifyPhoneNumberCommand<
  T extends RegistrationType = RegistrationType,
> extends RegistrationBaseCommand<T> {}

export class VerificationCompleteCommand<
  T extends RegistrationType = RegistrationType,
> extends RegistrationBaseCommand<T> {}
