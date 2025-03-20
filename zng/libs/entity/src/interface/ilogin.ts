import { EntityId } from '@library/shared/common/data';
import { LoginType } from '../enum';

export interface ILogin extends EntityId<string> {
  id: string;
  userId: string;
  loginType?: LoginType;
  secret: string | null;
  secretExpiresAt: Date | null;
  createdAt?: Date | null;
  updatedAt: Date | null;
}
