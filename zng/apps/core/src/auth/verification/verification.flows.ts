import { VerificationState } from '@library/entity/enum/verification.state';
import { VerificationFlowState } from './verification-flow.state';
import { VerificationEvents } from './verification-event.factory';

// NotVerified -> VerifyingEmail -> EmailVerified -> VerifyingPhoneNumber -> PhoneNumberVerified - > Verified
export const standardVerificationFlow: VerificationFlowState[] = [
  {
    state: VerificationState.NotRegistered,
    nextState: VerificationState.EmailVerifying,
    isVerified: false,
    requiresVerificationCode: false,
    returnToken: false,
    notificationName: null,
  },
  {
    state: VerificationState.EmailVerifying,
    nextState: VerificationState.EmailVerified,
    isVerified: false,
    requiresVerificationCode: true,
    returnToken: false,
    notificationName: VerificationEvents.VerificationEmailVerifyingEvent,
  },
  {
    state: VerificationState.EmailVerified,
    nextState: VerificationState.PhoneNumberVerifying,
    isVerified: false,
    requiresVerificationCode: false,
    returnToken: true,
    notificationName: VerificationEvents.VerificationEmailVerifiedEvent,
  },
  {
    state: VerificationState.PhoneNumberVerifying,
    nextState: VerificationState.PhoneNumberVerified,
    isVerified: false,
    requiresVerificationCode: true,
    returnToken: false,
    notificationName: VerificationEvents.VerificationPhoneNumberVerifyingEvent,
  },
  {
    state: VerificationState.PhoneNumberVerified,
    nextState: VerificationState.Registered,
    isVerified: false,
    requiresVerificationCode: false,
    returnToken: false,
    notificationName: VerificationEvents.VerificationPhoneNumberVerifiedEvent,
  },
  {
    state: VerificationState.Registered,
    nextState: null,
    isVerified: true,
    requiresVerificationCode: false,
    returnToken: false,
    notificationName: VerificationEvents.VerificationVerifiedEvent,
  },
];
