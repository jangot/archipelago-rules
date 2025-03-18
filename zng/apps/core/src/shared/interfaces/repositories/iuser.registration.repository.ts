import { IUserRegistration } from '@library/entity/interface';
import { IRepositoryBase } from '@library/shared/common/data';

export interface IUserRegistrationRepository extends IRepositoryBase<IUserRegistration> {
  getByUserId(userId: string): Promise<IUserRegistration | null>;
}

export const IUserRegistrationRepository = Symbol('IUserRegistrationRepository');
