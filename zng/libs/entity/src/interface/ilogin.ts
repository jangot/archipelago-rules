import { EntityId } from '@library/shared/common/data';
import { LoginType } from '../enum';

export interface ILogin extends EntityId<string> {
  id: string;
  type: LoginType;
  userId: string;
  secret: string | null;
  expiresAt: Date | null;
  attempts: number | null;
  unlocksAt: Date | null;

  externalId: string | null;
  externalData: string | null;
}
