import { IBillerAddress } from '@library/entity/entity-interface/ibiller-address';
import { IRepositoryBase } from '@library/shared/common/data';

/**
 * IBillerAddressRepository defines the contract for biller address persistence.
 *
 * This interface is intentionally left empty for now, as custom methods will be added in the future.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IBillerAddressRepository extends IRepositoryBase<IBillerAddress> {}

export const IBillerAddressRepository = Symbol('IBillerAddressRepository'); 