import { IBillerMask } from '@library/entity/entity-interface/ibiller-mask';
import { IRepositoryBase } from '@library/shared/common/data';

/**
 * IBillerMaskRepository defines the contract for biller mask persistence.
 *
 * This interface is intentionally left empty for now, as custom methods will be added in the future.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IBillerMaskRepository extends IRepositoryBase<IBillerMask> {}

export const IBillerMaskRepository = Symbol('IBillerMaskRepository'); 