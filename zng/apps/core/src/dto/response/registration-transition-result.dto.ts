import { RegistrationStatus } from '@library/entity/enum';

export class RegistrationTransitionResultDto {
  state: RegistrationStatus | null;
  isSuccessful: boolean;
  message: RegistrationTransitionMessage | null;
}

export enum RegistrationTransitionMessage {
  WrongInput = 'wrong_input',
  NoTransitionFound = 'no_transition_found',
  NoNextState = 'no_next_state',
  NoRegistrationStatusFound = 'no_registration_status_found',
}
