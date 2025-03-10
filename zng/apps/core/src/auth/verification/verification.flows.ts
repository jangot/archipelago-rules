import { RegistrationStatus } from '@library/entity/enum/registration.status';
import { VerificationFlowState } from './verification-flow.state';
import { VerificationEvent } from './verification-event.factory';

// NotVerified -> VerifyingEmail -> EmailVerified -> VerifyingPhoneNumber -> PhoneNumberVerified - > Verified
export const standardVerificationFlow: VerificationFlowState[] = [
  {
    state: RegistrationStatus.NotRegistered,
    nextState: RegistrationStatus.EmailVerifying,
    isVerified: false,
    requiresVerificationCode: false,
    returnToken: false,
    notificationName: null,
  },
  {
    state: RegistrationStatus.EmailVerifying,
    nextState: RegistrationStatus.EmailVerified,
    isVerified: false,
    requiresVerificationCode: true,
    returnToken: false,
    notificationName: VerificationEvent.EmailVerifying,
  },
  {
    state: RegistrationStatus.EmailVerified,
    nextState: RegistrationStatus.PhoneNumberVerifying,
    isVerified: false,
    requiresVerificationCode: false,
    returnToken: true,
    notificationName: VerificationEvent.EmailVerified,
  },
  {
    state: RegistrationStatus.PhoneNumberVerifying,
    nextState: RegistrationStatus.PhoneNumberVerified,
    isVerified: false,
    requiresVerificationCode: true,
    returnToken: false,
    notificationName: VerificationEvent.PhoneNumberVerifying,
  },
  {
    state: RegistrationStatus.PhoneNumberVerified,
    nextState: RegistrationStatus.Registered,
    isVerified: false,
    requiresVerificationCode: false,
    returnToken: false,
    notificationName: VerificationEvent.PhoneNumberVerified,
  },
  {
    state: RegistrationStatus.Registered,
    nextState: null,
    isVerified: true,
    requiresVerificationCode: false,
    returnToken: false,
    notificationName: VerificationEvent.Verified,
  },
];
