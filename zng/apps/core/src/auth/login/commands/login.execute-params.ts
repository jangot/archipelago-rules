import { ContactType } from '@library/entity/enum';

export interface LoginExecuteParams {
  userId?: string;
  contact?: string;
  contactType?: ContactType;
  verificationCode?: string;
  loginId?: string;
}
