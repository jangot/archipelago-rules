import { IBillerPayment } from '@library/entity/entity-interface/ibiller-payment';
import { IRepositoryBase } from '@library/shared/common/data';

/**
 * IBillerPaymentRepository defines the contract for biller payment persistence.
 *
 * This interface is intentionally left empty for now, as custom methods will be added in the future.
 */
 
export interface IBillerRepository extends IRepositoryBase<IBillerPayment> {}

export const IBillerRepository = Symbol('IBillerRepository');
