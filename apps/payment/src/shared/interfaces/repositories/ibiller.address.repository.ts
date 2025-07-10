import { IBillerAddress } from '@library/entity/entity-interface/ibiller-address';
import { IRepositoryBase } from '@library/shared/common/data';

/**
 * IBillerAddressRepository defines the contract for biller address persistence.
 *
 * This interface is intentionally left empty for now, as custom methods will be added in the future.
 */
export interface IBillerAddressRepository extends IRepositoryBase<IBillerAddress> {
  createBillerAddress(billerAddress: IBillerAddress): Promise<IBillerAddress>;
  updateBillerAddress(billerAddress: IBillerAddress): Promise<void>;
}

export const IBillerAddressRepository = Symbol('IBillerAddressRepository'); 
