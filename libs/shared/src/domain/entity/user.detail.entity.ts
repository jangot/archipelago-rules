// Sample Entity returned by the pgtyped wrapper

import { IGetUserDetailByIdResult } from '@library/shared/infrastructure/data/generated/get-user-detail.queries';


// Can't put TypeORM decorators on this class lest it create DB tables and columns
export class UserDetail implements IGetUserDetailByIdResult {
  deletedAt: Date | null;
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  phoneNumber: string;
}
