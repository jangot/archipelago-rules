import { IDomainServices } from '@core/modules/domain/idomain.services';
import { ILoan } from '@library/entity/entity-interface';
import { LoanPaymentType, LoanPaymentTypeCodes, LoanState, LoanStateCodes } from '@library/entity/enum';
import { LOAN_RELATIONS } from '@library/shared/domain/entity/relation';
import { Injectable } from '@nestjs/common';
import { BaseLoanStateManager } from './base-loan-state-manager';

/**
 * State manager for loans in the 'RepaymentPaused' state.
 * 
 * The RepaymentPaused state occurs when the loan repayment process has been
 * temporarily suspended due to borrower hardship, loan modification processes,
 * technical issues, or other circumstances requiring payment suspension.
 */
@Injectable()
export class RepaymentPausedLoanStateManager extends BaseLoanStateManager {
  constructor(domainServices: IDomainServices) {
    super(domainServices, LoanStateCodes.RepaymentPaused);
  }

  /**
   * Determines the next state for a loan with paused repayment operations.
   * 
   * The transition logic evaluates the resolution status of conditions that
   * caused the repayment pause and determines appropriate next actions.
   * 
   * @param loanId - The unique identifier of the paused loan
   * @returns Promise<LoanState | null> - Returns:
   *   - `LoanStateCodes.Repaying` if conditions allow resuming normal repayment
   *   - `LoanStateCodes.Repaid` if full payment received during pause period
   *   - `LoanStateCodes.Closed` if loan should be closed due to unresolvable issues
   *   - `LoanStateCodes.RepaymentPaused` if pause should continue (no state change)
   *   - `null` if error occurs or if escalation/special handling is required
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

    // Check conditions for transition to `LoanStateCodes.Repaying`
    const isPaymentResumed = this.isPaymentPending(loan, LoanPaymentTypeCodes.Repayment, 'repayment resumption');
    if (isPaymentResumed) return LoanStateCodes.Repaying;
    
    // Check conditions for transition to `LoanStateCodes.Closed`
    // TODO: Fogiveness check goes here OR in explicit ForgivenessInProgress state

    // If no conditions met, remain in `LoanStateCodes.RepaymentPaused`
    return LoanStateCodes.RepaymentPaused;

  }

  /**
   * Executes the state transition from RepaymentPaused to the determined next state.
   * 
   * This method handles the resumption of repayment or transition to closure
   * scenarios with careful attention to borrower circumstances and loan integrity.
   * 
   * The method ensures that repayment resumption or loan closure maintains
   * strict compliance with consumer protection regulations while providing
   * appropriate support and communication to borrowers throughout the process.
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
   * Gets the supported next states for a loan in the RepaymentPaused state.
   * 
   * @returns LoanState[] - An array of LoanState values that represent
   *   the possible next states for the loan
   */
  protected getSupportedNextStates(): LoanState[] {
    // RepaymentPaused loans can resume repaying, be closed, or transition to repaid
    return [LoanStateCodes.Repaying, LoanStateCodes.Closed, LoanStateCodes.Repaid];
  }

  /**
   * Gets the primary payment type applicable to loans in the RepaymentPaused state.
   * 
   * @returns LoanPaymentType - The primary LoanPaymentType value that
   *   represents the type of payments relevant to the loan's current state
   */
  protected getPrimaryPaymentType(): LoanPaymentType {
    // RepaymentPaused state still deals with repayment transactions that were paused
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
