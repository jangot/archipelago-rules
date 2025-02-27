import { IRepositoryBase } from '@library/shared/common/data';
import { AuthSecret } from '../../entity';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IAuthSecretRepository extends IRepositoryBase<AuthSecret> {}

export const IAuthSecretRepository = Symbol('IAuthSecretRepository');
