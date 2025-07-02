import { IBiller } from '@library/entity/entity-interface';
import { IRepositoryBase } from '@library/shared/common/data';
import { DeepPartial } from 'typeorm';

 
export interface IBillerRepository extends IRepositoryBase<IBiller> {
  getAllCustomBillers(createdById: string): Promise<IBiller[] | null>;
  createBiller(biller: DeepPartial<IBiller>): Promise<IBiller | null>;
}

export const IBillerRepository = Symbol('IBillerRepository');
