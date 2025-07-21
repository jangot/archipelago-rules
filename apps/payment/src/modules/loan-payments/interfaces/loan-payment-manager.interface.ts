import { LoanPayment } from '@library/shared/domain/entity';

/**
 * Interface for loan payment managers that handle specific lifecycle parts
 */
export interface ILoanPaymentManager {
  /**
   * Initiates a new loan payment for a specific loan
   * @param loanId The ID of the loan for which to initiate a payment
   * @returns The created loan payment or null if creation failed
   */
  initiate(loanId: string): Promise<LoanPayment | null>;

  /**
   * Advances the state of a loan payment based on step signals/events
   * @param loanPaymentId The ID of the loan payment to update
   * @param stepId The ID of the step that triggered the state change
   * @returns Boolean that shows were updates applied or not. `true` - payment was advanced, `false` - no updates required, `null` - update failed
   */
  advance(loanPaymentId: string): Promise<boolean | null>;
}
