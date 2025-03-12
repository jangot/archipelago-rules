import { RegistrationStatus } from '@library/entity/enum';
//import { RegistrationDto, RegistrationTransitionResultDto } from '../../dto';
import { VerificationEvent } from '../verification';
import { RegistrationExecuteParams } from './commands/registration.base.command-handler';
import { RegistrationBaseCommand } from './commands/registration.commands';

export interface RegistrationStageTransition {
  state: RegistrationStatus;
  nextState: RegistrationStatus | null;
  //action: (id: string | null, input: RegistrationDto | null) => Promise<RegistrationTransitionResultDto>;
  action: new (payload: RegistrationExecuteParams) => RegistrationBaseCommand;
  successEvent: VerificationEvent | null;
  failureEvent: VerificationEvent | null;
}
