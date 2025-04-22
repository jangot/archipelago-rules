import { IBiller } from '@library/entity/interface';
import { IRepositoryBase } from '@library/shared/common/data';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IBillerRepository extends IRepositoryBase<IBiller> {}

export const IBillerRepository = Symbol('IBillerRepository');
