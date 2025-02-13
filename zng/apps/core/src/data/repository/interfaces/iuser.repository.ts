import { IRepositoryBase } from '@library/shared/common/data/ibase.repository';
import { ApplicationUser } from '../../entity';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IUserRepository extends IRepositoryBase<ApplicationUser> {}

export const IUserRepository = Symbol('IUserRepository');
