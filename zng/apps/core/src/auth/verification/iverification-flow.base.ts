import { IApplicationUser } from '@library/entity/interface';
import { VerificationFlowState } from './verification-flow.state';
import { VerificationState } from '@library/entity/enum/verification.state';

export interface IVerificationFlow {
  next(): VerificationFlowState | null;
  isComplete(): boolean;
  setCurrentState(currentState: VerificationState): VerificationFlowState;
  sendNotification(user: IApplicationUser): void;
}
