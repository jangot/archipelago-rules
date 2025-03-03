import { RegistrationStage } from '@library/entity/enum';
import { RegistrationDto } from '../../dto';

export interface RegistrationStageTransition {
  from?: RegistrationStage;
  to: RegistrationStage;
  action: (id?: string, input?: RegistrationDto) => Promise<void>;
}
