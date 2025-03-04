import { EntityId, ISoftDeleteEntity } from '@library/shared/common/data';
import { RegistrationType } from '../enum';

export interface IApplicationUser extends EntityId<string>, ISoftDeleteEntity {
  id: string; // UUID
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  registrationType: RegistrationType | null;
  registeredAt: Date | null;
}
