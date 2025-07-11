import { IDomainServices } from '@core/modules/domain/idomain.services';
import { ILoan } from '@library/entity/entity-interface';
import { LoanPaymentType, LoanPaymentTypeCodes, LoanState, LoanStateCodes } from '@library/entity/enum';
import { LOAN_RELATIONS } from '@library/shared/domain/entity/relation';
import { Injectable } from '@nestjs/common';
import { BaseLoanStateManager } from './base-loan-state-manager';

/**
 * State manager for loans in the 'Repaying' state.
 * 
 * The Repaying state represents an active loan where the borrower has begun
 * making payments against the loan balance. This is the primary operational
 * state for loans in active repayment with ongoing payment obligations.
 */
@Injectable()
export class RepayingLoanStateManager extends BaseLoanStateManager {
  constructor(domainServices: IDomainServices) {
    super(domainServices, LoanStateCodes.Repaying);
  }

  /**
   * Determines the next state for a loan in active repayment.
   * 
   * The transition logic evaluates payment progress, borrower behavior,
   * and loan status to determine appropriate state transitions.
   * 
   * @param loanId - The unique identifier of the loan in repayment
   * @returns Promise<LoanState | null> - Returns:
   *   - `LoanStateCodes.Repaid` if loan balance is fully satisfied
   *   - `LoanStateCodes.RepaymentPaused` if repayment should be temporarily suspended
   *   - `LoanStateCodes.Closed` if loan should be closed due to special circumstances
   *   - `LoanStateCodes.Repaying` if loan should continue in current state (no change / next repayment init)
   *   - `null` if an error occurs during evaluation or escalation is required
   */
   
  protected async getNextState(loanId: string): Promise<LoanState | null> {
    const loan = await this.getLoan(loanId, [LOAN_RELATIONS.Payments]);

    if (!loan) return null;

    if (!this.isActualStateValid(loan)) return null;

    // Check conditions for transition to `LoanStateCodes.Repaid`
    // Despite other states the payment completion DOES NOT mean the loan is fully repaid
    // Only if last payment is completed we set the loan to Repaid state
    const isPaymentCompleted = this.isPaymentCompleted(loan, this.getPrimaryPaymentType(),
      'repayment completion');
    if (isPaymentCompleted && this.isLastPayment(loan)) {
      return LoanStateCodes.Repaid;
    } else if (isPaymentCompleted) {
      // If payment is completed but not the last one, we remain in Repaying state
      // TODO: Ensure that next payment initiation handled level higher, where we catch Payment Competion event
      // OR fire explicit Event to initiate next payment
      return LoanStateCodes.Repaying;
    }

    // Check conditions for transition to `LoanStateCodes.RepaymentPaused`
    const isPaymentFailed = this.isPaymentFailed(loan, this.getPrimaryPaymentType(),
      'repayment pause');
    if (isPaymentFailed) {
      return LoanStateCodes.RepaymentPaused;
    }

    // Check conditions for transition to `LoanStateCodes.Closed`
    // TODO: Fogiveness check goes here OR in explicit ForgivenessInProgress state

    // If no conditions met, remain in `LoanStateCodes.Repaying`
    return LoanStateCodes.Repaying;
  }

  /**
   * Executes the state transition from Repaying to the determined next state.
   * 
   * This method handles various repayment completion and intervention scenarios.:
   * 
   * @param loanId - The unique identifier of the loan to update
   * @param nextState - The target state to transition the loan to
   * @returns Promise<boolean | null> - Returns:
   *   - `true` if state transition completed successfully
   *   - `null` if transition failed or if issues prevent safe state change
   */
  protected async setNextState(loanId: string, nextState: LoanState): Promise<boolean | null> {
    return this.executeStateTransition(loanId, nextState);
  }

  /**
   * Gets the supported next states for loans in the Repaying state.
   * 
   * @returns LoanState[] - Array of supported next states
   */
  protected getSupportedNextStates(): LoanState[] {
    // Repaying loans can transition to Repaid, RepaymentPaused, or Closed
    return [LoanStateCodes.Repaid, LoanStateCodes.RepaymentPaused, LoanStateCodes.Closed];
  }

  /**
   * Gets the primary payment type for loans in the Repaying state.
   * 
   * @returns LoanPaymentType - The primary payment type for repayment
   */
  protected getPrimaryPaymentType(): LoanPaymentType {
    // Repaying state deals with active repayment transactions
    return LoanPaymentTypeCodes.Repayment;
  }

  /**
   * Determines if the current payment is the last payment for the loan.
   * 
   * @param loan - The loan entity with payment information
   * @returns boolean - True if this is the last payment, false otherwise
   */
  private isLastPayment(loan: ILoan): boolean {
    const { paymentsCount } = loan;
    const currentPayment = this.getStateEvaluationPayment(loan, this.getPrimaryPaymentType(), 'last payment check', true);
    if (!currentPayment) {
      this.logger.error(`No current payment found for loan ${loan.id} to check if it is the last payment`);
      return false;
    }

    return paymentsCount === currentPayment.paymentNumber;
  }
}
