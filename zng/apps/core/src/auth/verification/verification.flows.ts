import { RegistrationStatus } from '@library/entity/enum/verification.state';
import { VerificationFlowState } from './verification-flow.state';
import { VerificationEvents } from './verification-event.factory';

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
    notificationName: VerificationEvents.VerificationEmailVerifyingEvent,
  },
  {
    state: RegistrationStatus.EmailVerified,
    nextState: RegistrationStatus.PhoneNumberVerifying,
    isVerified: false,
    requiresVerificationCode: false,
    returnToken: true,
    notificationName: VerificationEvents.VerificationEmailVerifiedEvent,
  },
  {
    state: RegistrationStatus.PhoneNumberVerifying,
    nextState: RegistrationStatus.PhoneNumberVerified,
    isVerified: false,
    requiresVerificationCode: true,
    returnToken: false,
    notificationName: VerificationEvents.VerificationPhoneNumberVerifyingEvent,
  },
  {
    state: RegistrationStatus.PhoneNumberVerified,
    nextState: RegistrationStatus.Registered,
    isVerified: false,
    requiresVerificationCode: false,
    returnToken: false,
    notificationName: VerificationEvents.VerificationPhoneNumberVerifiedEvent,
  },
  {
    state: RegistrationStatus.Registered,
    nextState: null,
    isVerified: true,
    requiresVerificationCode: false,
    returnToken: false,
    notificationName: VerificationEvents.VerificationVerifiedEvent,
  },
];
