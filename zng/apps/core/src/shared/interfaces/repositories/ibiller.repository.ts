import { IBiller } from '@library/entity/interface';
import { IRepositoryBase } from '@library/shared/common/data';

 
export interface IBillerRepository extends IRepositoryBase<IBiller> {
  getAllCustomBillers(createdById: string): Promise<IBiller[] | null>;
}

export const IBillerRepository = Symbol('IBillerRepository');
