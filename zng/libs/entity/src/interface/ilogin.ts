import { EntityId } from '@library/shared/common/data';
import { LoginStatus, LoginType } from '../enum';

export interface ILogin extends EntityId<string> {
  id: string;
  userId: string;
  loginType: LoginType;
  loginStatus: LoginStatus;
  attempts: number | null;
  secret: string | null;
  secretExpiresAt: Date | null;
  createdAt: Date | null;
  lastLoggedInAt: Date | null;
  refreshToken: string | null;
  externalId: string | null;
  externalData: string | null;
}
