import { IRepositoryBase } from '@library/shared/common/data';
import { UserRegistration } from '../../entity';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IUserRegistrationRepository extends IRepositoryBase<UserRegistration> {}

export const IUserRegistrationRepository = Symbol('IUserRegistrationRepository');
