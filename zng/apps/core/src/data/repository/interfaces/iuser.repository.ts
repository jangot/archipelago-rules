import { IRepositoryBase } from './ibase.repository';
import { ApplicationUserEntity } from '../../entity';

export interface IUserRepository<T extends ApplicationUserEntity> extends IRepositoryBase<T> {
  getByEmail(email: string): Promise<T | null>; // for example purposes
}
