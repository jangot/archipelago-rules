import { VerificationState } from '@library/entity/enum/verification.state';
import { VerificationEvents } from './verification-event.factory';

export interface VerificationFlowState {
  state: VerificationState;
  nextState: VerificationState | null;
  isVerified: boolean;
  requiresVerificationCode: boolean;
  returnToken: boolean;
  notificationName: VerificationEvents | null;
}
