import { ILoanPaymentManager } from './loan-payment-manager.interface';
import { LoanPaymentType } from '@library/entity/enum';

/**
 * Interface for the loan payment factory that creates appropriate payment managers
 * based on loan lifecycle part
 */
export interface ILoanPaymentFactory {
  /**
   * Gets the appropriate loan payment manager for a specific payment type
   * @param paymentType The type of loan payment being processed
   * @returns The appropriate loan payment manager for the specified payment type
   */
  getManager(paymentType: LoanPaymentType): ILoanPaymentManager;
}
