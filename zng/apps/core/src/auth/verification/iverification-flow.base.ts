import { IApplicationUser } from '@library/entity/interface';
import { VerificationFlowState } from './verification-flow.state';
import { RegistrationStatus } from '@library/entity/enum/verification.state';

export interface IVerificationFlow {
  next(): VerificationFlowState | null;
  isComplete(): boolean;
  setCurrentState(currentState: RegistrationStatus): VerificationFlowState;
  sendNotification(user: IApplicationUser): void;
}
