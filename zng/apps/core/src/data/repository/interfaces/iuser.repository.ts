import { IRepositoryBase } from '@library/shared/common/data/ibase.repository';
import { ApplicationUser } from '../../entity';

export interface IUserRepository extends IRepositoryBase<ApplicationUser> {
  getByEmail(email: string): Promise<ApplicationUser | null>; // for example purposes
}

export const IUserRepository = Symbol('IUserRepository');