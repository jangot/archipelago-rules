import { RegistrationStatus } from '@library/entity/enum';

export class RegistrationTransitionResult {
  state: RegistrationStatus | null;
  isSuccessful: boolean;
  userId?: string;
  loginId?: string;
  code?: string;
  accessToken?: string;
  refreshToken?: string;
}

