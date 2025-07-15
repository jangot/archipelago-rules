import { IDomainServices } from '@core/modules/domain/idomain.services';
import { LoanPaymentType, LoanPaymentTypeCodes, LoanState, LoanStateCodes } from '@library/entity/enum';
import { Injectable } from '@nestjs/common';
import { EVALUATION_CONTEXT_CODES, StateDecision } from '../interfaces';
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
    this.paymentStrategy = this.getDefaultPaymentStrategy();
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
    return this.evaluateStateTransition(loanId);
  }

  protected getStateDecisions(): StateDecision[] {
    return [
      {
        // RepaymentStrategy handles the special "last payment" logic
        condition: (loan) => this.paymentStrategy.shouldTransitionToCompleted(loan, EVALUATION_CONTEXT_CODES.REPAYMENT.COMPLETION),
        nextState: LoanStateCodes.Repaid,
        priority: 1,
      },
      {
        condition: (loan) => this.paymentStrategy.shouldTransitionToResumed(loan, EVALUATION_CONTEXT_CODES.REPAYMENT.RESUME),
        nextState: LoanStateCodes.Repaying,
        priority: 2,
      },
      {
        condition: (loan) => this.paymentStrategy.shouldTransitionToFallback(loan, EVALUATION_CONTEXT_CODES.REPAYMENT.FALLBACK),
        nextState: LoanStateCodes.Closed,
        priority: 3,
      },
    ];
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

}
