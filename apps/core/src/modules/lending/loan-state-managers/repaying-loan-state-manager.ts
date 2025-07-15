import { IDomainServices } from '@core/modules/domain/idomain.services';
import { LoanPaymentType, LoanPaymentTypeCodes, LoanState, LoanStateCodes } from '@library/entity/enum';
import { Injectable } from '@nestjs/common';
import { EVALUATION_CONTEXT_CODES, StateDecision } from '../interfaces';
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
    this.paymentStrategy = this.getDefaultPaymentStrategy();
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
        condition: (loan) => this.paymentStrategy.shouldTransitionToPaused(loan, EVALUATION_CONTEXT_CODES.REPAYMENT.PAUSE),
        nextState: LoanStateCodes.RepaymentPaused,
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
}
