import { RegistrationStatus } from '@library/entity/enum/verification.state';
import { VerificationEvents } from './verification-event.factory';

export interface VerificationFlowState {
  state: RegistrationStatus;
  nextState: RegistrationStatus | null;
  isVerified: boolean;
  requiresVerificationCode: boolean;
  returnToken: boolean;
  notificationName: VerificationEvents | null;
}
