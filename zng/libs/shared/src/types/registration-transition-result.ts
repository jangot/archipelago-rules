import { RegistrationStatus } from '@library/entity/enum';

export class RegistrationTransitionResult {
  state: RegistrationStatus | null;
  isSuccessful: boolean;
  message: RegistrationTransitionMessage | null;
  userId?: string;
  code?: string;
  accessToken?: string;
  refreshToken?: string;
}

export enum RegistrationTransitionMessage {
  WrongInput = 'wrong_input',
  NoTransitionFound = 'no_transition_found',
  NoNextState = 'no_next_state',
  NoRegistrationStatusFound = 'no_registration_status_found',
  NoContactProvided = 'no_contact_provided',
  ContactTaken = 'contact_taken',
  NoSecretFound = 'no_secret_found',
  SecretExpired = 'secret_expired',
  VerificationCodeMismatch = 'verification_code_mismatch',
  VerificationCouldNotBeCompleted = 'verification_could_not_be_completed',
  CouldNotCreateUser = 'could_not_create_user',
  NotAwaitingForCode = 'not_awaiting_for_code',
  AlreadyVerified = 'already_verified',
}
