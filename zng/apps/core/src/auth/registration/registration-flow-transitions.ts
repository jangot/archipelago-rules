import { RegistrationStatus } from '@library/entity/enum';
import { VerificationEvent } from '../verification';
import {
  InitiatePhoneNumberVerificationCommand,
  RegistrationInitiatedCommand,
  VerificationCodeResendCommand,
  VerificationCompleteCommand,
  VerifyEmailCommand,
  VerifyPhoneNumberCommand,
} from './commands';
import { RegistrationStageTransition } from './stage-transition.interface';

export const organicRegistrationFlow: RegistrationStageTransition[] = [
  {
    state: RegistrationStatus.NotRegistered,
    nextState: RegistrationStatus.EmailVerifying,
    successEvent: VerificationEvent.EmailVerifying,
    failureEvent: null,
    action: RegistrationInitiatedCommand,
  },
  {
    state: RegistrationStatus.EmailVerifying,
    nextState: RegistrationStatus.EmailVerified,
    successEvent: VerificationEvent.EmailVerified,
    failureEvent: null,
    action: VerifyEmailCommand,
  },
  {
    state: RegistrationStatus.EmailVerified,
    nextState: RegistrationStatus.PhoneNumberVerifying,
    successEvent: VerificationEvent.PhoneNumberVerifying,
    failureEvent: null,
    action: InitiatePhoneNumberVerificationCommand,
  },
  {
    state: RegistrationStatus.PhoneNumberVerifying,
    nextState: RegistrationStatus.PhoneNumberVerified,
    successEvent: VerificationEvent.PhoneNumberVerified,
    failureEvent: null,
    action: VerifyPhoneNumberCommand,
  },
  {
    state: RegistrationStatus.PhoneNumberVerified,
    nextState: RegistrationStatus.Registered,
    successEvent: VerificationEvent.Verified,
    failureEvent: null,
    action: VerificationCompleteCommand,
  },
  // Code re-send transitions (keeps registration in the same state)
  {
    state: RegistrationStatus.EmailVerifying,
    nextState: RegistrationStatus.EmailVerifying,
    successEvent: VerificationEvent.EmailCodeResent,
    failureEvent: null,
    action: VerificationCodeResendCommand,
  },
  {
    state: RegistrationStatus.PhoneNumberVerifying,
    nextState: RegistrationStatus.PhoneNumberVerifying,
    successEvent: VerificationEvent.PhoneNumberCodeResent,
    failureEvent: null,
    action: VerificationCodeResendCommand,
  },
];
