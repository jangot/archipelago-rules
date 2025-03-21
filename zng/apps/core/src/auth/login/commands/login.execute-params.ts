import { ContactType } from '@library/entity/enum';

export interface LoginExecuteParams {
  userId?: string;
  loginId?: string;
  contact?: string;
  contactType?: ContactType;
  verificationCode?: string;
}

export interface RefreshTokenParams extends LoginExecuteParams {
  refreshToken: string;
}
