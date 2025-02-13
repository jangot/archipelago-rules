import { EntityId } from '@library/shared/common/data/id.entity';

export interface IApplicationUser extends EntityId<string> {
  id: string; // UUID
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}
