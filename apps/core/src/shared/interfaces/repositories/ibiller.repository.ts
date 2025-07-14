import { IBiller } from '@library/entity/entity-interface';
import { IRepositoryBase } from '@library/shared/common/data';
 
export interface IBillerRepository extends IRepositoryBase<IBiller> {
  getAllCustomBillers(createdById: string): Promise<IBiller[] | null>;
  createBiller(biller: Partial<IBiller>): Promise<IBiller | null>;
}

export const IBillerRepository = Symbol('IBillerRepository');
