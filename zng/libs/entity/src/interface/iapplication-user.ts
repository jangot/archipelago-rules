import { EntityId, ISoftDeleteEntity } from '@library/shared/common/data';

export interface IApplicationUser extends EntityId<string>, ISoftDeleteEntity {
  id: string; // UUID
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}
