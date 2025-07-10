import { IBillerMask } from '@library/entity/entity-interface/ibiller-mask';
import { IRepositoryBase } from '@library/shared/common/data';

/**
 * IBillerMaskRepository defines the contract for biller mask persistence.
 *
 * This interface is intentionally left empty for now, as custom methods will be added in the future.
 */
 
export interface IBillerMaskRepository extends IRepositoryBase<IBillerMask> {
  createBillerMask(billerMask: IBillerMask): Promise<IBillerMask>;
  updateBillerMask(billerMask: IBillerMask): Promise<void>;
}

export const IBillerMaskRepository = Symbol('IBillerMaskRepository'); 
