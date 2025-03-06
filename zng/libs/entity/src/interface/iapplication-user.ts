import { EntityId, ISoftDeleteEntity } from '@library/shared/common/data';
import { VerificationState } from '../enum/verification.state';

export interface IApplicationUser extends EntityId<string>, ISoftDeleteEntity {
  id: string; // UUID
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  createdAt: Date;
  verificationCode: string | null;
  verificationCodeExpiresAt: Date | null;
  verificationState: VerificationState;
}
