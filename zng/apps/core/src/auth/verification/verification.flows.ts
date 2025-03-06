import { VerificationState } from '@library/entity/enum/verification.state';
import { VerificationFlowState } from './verification-flow.state';
import { VerificationEvents } from './verification-event.factory';

// NotVerified -> VerifyingEmail -> EmailVerified -> VerifyingPhoneNumber -> PhoneNumberVerified - > Verified
export const standardVerificationFlow: VerificationFlowState[] = [
  {
    state: VerificationState.NotVerified,
    nextState: VerificationState.VerifyingEmail,
    isVerified: false,
    requiresVerificationCode: false,
    returnToken: false,
    notificationName: null,
  },
  {
    state: VerificationState.VerifyingEmail,
    nextState: VerificationState.EmailVerified,
    isVerified: false,
    requiresVerificationCode: true,
    returnToken: false,
    notificationName: VerificationEvents.VerificationEmailVerifyingEvent,
  },
  {
    state: VerificationState.EmailVerified,
    nextState: VerificationState.VerifyingPhoneNumber,
    isVerified: false,
    requiresVerificationCode: false,
    returnToken: true,
    notificationName: VerificationEvents.VerificationEmailVerifiedEvent,
  },
  {
    state: VerificationState.VerifyingPhoneNumber,
    nextState: VerificationState.PhoneNumberVerified,
    isVerified: false,
    requiresVerificationCode: true,
    returnToken: false,
    notificationName: VerificationEvents.VerificationPhoneNumberVerifyingEvent,
  },
  {
    state: VerificationState.PhoneNumberVerified,
    nextState: VerificationState.Verified,
    isVerified: false,
    requiresVerificationCode: false,
    returnToken: false,
    notificationName: VerificationEvents.VerificationPhoneNumberVerifiedEvent,
  },
  {
    state: VerificationState.Verified,
    nextState: null,
    isVerified: true,
    requiresVerificationCode: false,
    returnToken: false,
    notificationName: VerificationEvents.VerificationVerifiedEvent,
  },
];
