import { RegistrationStage } from '@library/entity/enum';
import { RegistrationDto } from '../../dto';

export interface RegistrationStageTransition {
  from?: RegistrationStage;
  to: RegistrationStage;
  // TODO: Fix the return type of the action
  action: (id?: string, input?: RegistrationDto) => Promise<unknown>;
}
