import { IBillerName } from '@library/entity/entity-interface/ibiller-name';
import { IRepositoryBase } from '@library/shared/common/data';

/**
 * IBillerNameRepository defines the contract for biller name persistence.
 *
 * This interface is intentionally left empty for now, as custom methods will be added in the future.
 */
 
export interface IBillerNameRepository extends IRepositoryBase<IBillerName> {}

export const IBillerNameRepository = Symbol('IBillerNameRepository'); 
