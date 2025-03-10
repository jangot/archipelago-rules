import { IRepositoryBase } from '@library/shared/common/data/ibase.repository';
import { ApplicationUser } from '../../entity';
import { ContactType } from '@library/entity/enum';
import { IGetUserDetailByIdResult } from '../../sql_generated/get-user-detail.queries';

export interface IUserRepository extends IRepositoryBase<ApplicationUser> {
  getUserById(id: string): Promise<ApplicationUser | null>;
  getUserByContact(contact: string, type: ContactType): Promise<ApplicationUser | null>;

  // pgtyped test method
  getUserDetailById(userId: string): Promise<IGetUserDetailByIdResult | null>;
}

export const IUserRepository = Symbol('IUserRepository');
