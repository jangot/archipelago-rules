import { IDomainServices } from '@core/modules/domain/idomain.services';
import { LoanPaymentType, LoanPaymentTypeCodes, LoanState, LoanStateCodes } from '@library/entity/enum';
import { Injectable } from '@nestjs/common';
import { EVALUATION_CONTEXT_CODES, StateDecision } from '../interfaces';
import { BaseLoanStateManager } from './base-loan-state-manager';



/**
 * State manager for loans in the 'Funding' state.
 * 
 * The Funding state represents the active process of transferring funds from the
 * lender's account to Zirtue's holding account. This is a critical operational
 * state where financial transactions are in progress.
 */
@Injectable()
export class FundingLoanStateManager extends BaseLoanStateManager {


  constructor(domainServices: IDomainServices) {
    super(domainServices, LoanStateCodes.Funding);
    this.paymentStrategy = this.getDefaultPaymentStrategy();
  }

  protected getStateDecisions(): StateDecision[] {
    return [
      {
        condition: (loan) => this.paymentStrategy.shouldTransitionToCompleted(loan, EVALUATION_CONTEXT_CODES.FUNDING.COMPLETION),
        nextState: LoanStateCodes.Funded,
        priority: 1,
      },
      {
        condition: (loan) => this.paymentStrategy.shouldTransitionToPaused(loan, EVALUATION_CONTEXT_CODES.FUNDING.PAUSE),
        nextState: LoanStateCodes.FundingPaused,
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
    return [LoanStateCodes.Funded, LoanStateCodes.FundingPaused, LoanStateCodes.Accepted];
  }

  protected getPrimaryPaymentType(): LoanPaymentType {
    return LoanPaymentTypeCodes.Funding;
  }

  /**
   * Determines the next state for a loan currently in the funding process.
   * 
   * The transition logic monitors the funding transaction status and determines
   * the appropriate next state based on several scenarios.
   * 
   * @param loanId - The unique identifier of the loan being funded
   * @returns Promise<LoanState | null> - Returns:
   *   - `LoanStateCodes.Funded` if funding completed successfully
   *   - `LoanStateCodes.FundingPaused` if funding needs to be paused
   *   - `LoanStateCodes.Accepted` if funding failed and manual intervention needed
   *   - `LoanStateCodes.Funding` if funding should continue (no state change)
   *   - `null` if an error occurs during status evaluation
   */
   
  protected async getNextState(loanId: string): Promise<LoanState | null> {
    return this.evaluateStateTransition(loanId);
  }

  /**
   * Executes the state transition from Funding to the determined next state.
   * 
   * This method handles the complex orchestration required when transitioning
   * from the Funding state, with different behaviors based on the target state.
   * 
   * @param loanId - The unique identifier of the loan to update
   * @param nextState - The target state to transition the loan to
   * @returns Promise<boolean | null> - Returns:
   *   - `true` if the state transition completed successfully
   *   - `null` if the transition failed and appropriate rollback was executed
   */
  protected async setNextState(loanId: string, nextState: LoanState): Promise<boolean | null> {
    return this.executeStateTransition(loanId, nextState);
  }
}
