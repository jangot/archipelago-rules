import { IRepositoryBase } from '@library/shared/common/data/ibase.repository';
import { ContactType } from '@library/entity/enum';
import { IApplicationUser } from '@library/entity/entity-interface';
import { IGetUserDetailByIdResult } from '@core/modules/data/sql_generated/get-user-detail.queries';

export interface IUserRepository extends IRepositoryBase<IApplicationUser> {
  getUserByContact(contact: string, type: ContactType): Promise<IApplicationUser | null>;

  // pgtyped test method
  getUserDetailById(userId: string): Promise<IGetUserDetailByIdResult | null>;
}

export const IUserRepository = Symbol('IUserRepository');
