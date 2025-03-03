import { IRepositoryBase } from '@library/shared/common/data';
import { Registration } from '../../entity';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IRegistrationRepository extends IRepositoryBase<Registration> {}

export const IRegistrationRepository = Symbol('IRegistrationRepository');
