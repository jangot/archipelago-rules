import { EntityId } from '@library/shared/common/data';
import { LoginType, RegistrationStage } from '../enum';

export interface ILogin extends EntityId<string> {
  id: string;
  type: LoginType;
  userId: string;
  secret: string;
  expiresAt: Date | null;
  stage: RegistrationStage;
  attempts: number | null;
  unlocksAt: Date | null;

  externalId: string | null;
  externalData: string | null;
}
