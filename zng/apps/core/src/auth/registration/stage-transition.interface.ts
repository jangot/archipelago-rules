import { RegistrationStatus } from '@library/entity/enum';
import { RegistrationDto, RegistrationTransitionResultDto } from '../../dto';
import { VerificationEvent } from '../verification';

export interface RegistrationStageTransition {
  state: RegistrationStatus;
  nextState: RegistrationStatus | null;
  action: (id: string | null, input: RegistrationDto | null) => Promise<RegistrationTransitionResultDto>;
  successEvent: VerificationEvent | null;
  failureEvent: VerificationEvent | null;
}
