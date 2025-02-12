import { IRepositoryBase } from '@library/shared/common/data/ibase.repository';
import { ApplicationUser } from '../../entity';

export interface IUserRepository extends IRepositoryBase<ApplicationUser> { }

export const IUserRepository = Symbol('IUserRepository');