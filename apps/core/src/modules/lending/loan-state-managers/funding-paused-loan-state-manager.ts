import { IDomainServices } from '@core/modules/domain/idomain.services';
import { LoanPaymentType, LoanPaymentTypeCodes, LoanState, LoanStateCodes } from '@library/entity/enum';
import { Injectable } from '@nestjs/common';
import { EVALUATION_CONTEXT_CODES, StateDecision } from '../interfaces';
import { BaseLoanStateManager } from './base-loan-state-manager';



/**
 * State manager for loans in the 'FundingPaused' state.
 * 
 * The FundingPaused state occurs when the funding process has been temporarily
 * suspended due to various business, technical, or regulatory reasons. This state
 * preserves the loan's progress while allowing for issue resolution.
 */
@Injectable()
export class FundingPausedLoanStateManager extends BaseLoanStateManager {
  constructor(domainServices: IDomainServices) {
    super(domainServices, LoanStateCodes.FundingPaused);
    this.paymentStrategy = this.getDefaultPaymentStrategy();
  }

  /**
   * Determines the next state for a loan with paused funding operations.
   * 
   * The transition logic evaluates the resolution status of issues that caused
   * the pause and determines the appropriate next action.
   * 
   * @param loanId - The unique identifier of the paused loan
   * @returns Promise<LoanState | null> - Returns:
   *   - `LoanStateCodes.Funding` if conditions allow resuming the funding process
  *    - `LoanStateCodes.Funded` if payment error was fixed and funding can be completed
   *   - `LoanStateCodes.Accepted` if funding should be restarted from the beginning
   *   - `LoanStateCodes.FundingPaused` if the pause should continue (no state change)
   *   - `null` if an error occurs during evaluation or if escalation is required
   */
   
  protected async getNextState(loanId: string): Promise<LoanState | null> {
    return this.evaluateStateTransition(loanId);
  }

  /**
   * Executes the state transition from FundingPaused to the determined next state.
   * 
   * This method handles the resumption or redirection of paused funding operations
   * with careful attention to maintaining transaction integrity.
   * 
   * The method ensures that resuming funding operations maintains the same
   * level of security, compliance, and reliability as the original funding initiation.
   * 
   * @param loanId - The unique identifier of the loan to update
   * @param nextState - The target state to transition the loan to
   * @returns Promise<boolean | null> - Returns:
   *   - `true` if the state transition and process resumption completed successfully
   *   - `null` if the transition failed or if issues prevent safe resumption
   */   
  protected async setNextState(loanId: string, nextState: LoanState): Promise<boolean | null> {
    return this.executeStateTransition(loanId, nextState);
  }

  protected getStateDecisions(): StateDecision[] {
    return [
      {
        condition: (loan) => this.paymentStrategy.shouldTransitionToResumed(loan, EVALUATION_CONTEXT_CODES.FUNDING.RESUME),
        nextState: LoanStateCodes.Funding,
        priority: 1,
      },
      {
        condition: (loan) => this.paymentStrategy.shouldTransitionToCompleted(loan, EVALUATION_CONTEXT_CODES.FUNDING.COMPLETION),
        nextState: LoanStateCodes.Funded,
        priority: 2,
      },
      {
        condition: (loan) => this.paymentStrategy.shouldTransitionToFallback(loan, EVALUATION_CONTEXT_CODES.FUNDING.FALLBACK),
        nextState: LoanStateCodes.Accepted,
        priority: 3,
      },
    ];
  }

  protected getSupportedNextStates(): LoanState[] {
    return [LoanStateCodes.Funded, LoanStateCodes.Accepted, LoanStateCodes.Funding];
  }

  protected getPrimaryPaymentType(): LoanPaymentType {
    return LoanPaymentTypeCodes.Funding;
  }
}
