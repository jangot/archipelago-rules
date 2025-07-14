import { IBiller } from '@library/entity/entity-interface';
import { IRepositoryBase } from '@library/shared/common/data';

/**
 * IBillerPaymentRepository defines the contract for biller payment persistence.
 *
 * This interface is intentionally left empty for now, as custom methods will be added in the future.
 */
 
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IBillerRepository extends IRepositoryBase<IBiller> {}

export const IBillerRepository = Symbol('IBillerRepository');
