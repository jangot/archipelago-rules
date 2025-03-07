import { EntityId, ISoftDeleteEntity } from '@library/shared/common/data';
import { RegistrationStatus } from '../enum/verification.state';

export interface IApplicationUser extends EntityId<string>, ISoftDeleteEntity {
  id: string; // UUID

  firstName: string | null;
  lastName: string | null;

  pendingEmail: string | null;
  email: string | null;

  pendingPhoneNumber: string | null;
  phoneNumber: string | null;

  createdAt: Date;
  deletedAt: Date | null;

  registrationStatus: RegistrationStatus;
  onboardStatus: string | null;
}
