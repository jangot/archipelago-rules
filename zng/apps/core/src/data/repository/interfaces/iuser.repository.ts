import { IRepositoryBase } from '@library/shared/common/data/ibase.repository';
import { ApplicationUser } from '../../entity';
import { ContactType } from '@library/entity/enum';
import { UserDetail } from '../../entity/user.detail.entity';

export interface IUserRepository extends IRepositoryBase<ApplicationUser> {
  getUserById(id: string): Promise<ApplicationUser | null>;
  getUserByContact(contact: string, type: ContactType): Promise<ApplicationUser | null>;

  // pgtyped test method
  getUserDetailById(userId: string): Promise<UserDetail | null>;
}

export const IUserRepository = Symbol('IUserRepository');
