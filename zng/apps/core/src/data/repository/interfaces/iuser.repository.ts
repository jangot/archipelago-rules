import { IRepositoryBase } from './ibase.repository';
import { ApplicationUser } from '../../entity';

export interface IUserRepository<T extends ApplicationUser> extends IRepositoryBase<T> {
  getByEmail(email: string): Promise<T | null>; // for example purposes
}
