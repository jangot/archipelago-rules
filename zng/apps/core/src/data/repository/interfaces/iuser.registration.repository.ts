import { IRepositoryBase } from '@library/shared/common/data';
import { UserRegistration } from '../../entity';

export interface IUserRegistrationRepository extends IRepositoryBase<UserRegistration> {
  getByUserId(userId: string): Promise<UserRegistration | null>;
}

export const IUserRegistrationRepository = Symbol('IUserRegistrationRepository');
