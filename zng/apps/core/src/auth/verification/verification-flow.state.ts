import { RegistrationStatus } from '@library/entity/enum/registration.status';
import { VerificationEvent } from './verification-event.factory';

export interface VerificationFlowState {
  state: RegistrationStatus;
  nextState: RegistrationStatus | null;
  isVerified: boolean;
  requiresVerificationCode: boolean;
  returnToken: boolean;
  notificationName: VerificationEvent | null; // TODO: Split to Events and Notifications???
}
