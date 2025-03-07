import { EntityId } from '@library/shared/common/data';
import { RegistrationStatus } from '../enum/verification.state';

export interface IUserRegistration extends EntityId<string> {
  id: string;
  userId: string;
  status: RegistrationStatus;
  createdAt: Date;
  secret: string | null;
  secretExpiresAt: Date | null;
}
