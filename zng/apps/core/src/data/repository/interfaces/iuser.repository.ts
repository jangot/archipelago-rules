import { IRepositoryBase } from '@library/shared/common/data/ibase.repository';
import { ApplicationUser } from '../../entity';
import { ContactType } from '@library/entity/enum';

export interface IUserRepository extends IRepositoryBase<ApplicationUser> {
  getUserById(id: string): Promise<ApplicationUser | null>;
  getUserByContact(contact: string, type: ContactType): Promise<ApplicationUser | null>;
}

export const IUserRepository = Symbol('IUserRepository');
