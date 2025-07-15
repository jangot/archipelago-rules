import { IDomainServices } from '@core/modules/domain/idomain.services';
import { LoanPaymentType, LoanPaymentTypeCodes, LoanState, LoanStateCodes } from '@library/entity/enum';
import { Injectable } from '@nestjs/common';
import { EVALUATION_CONTEXT_CODES, StateDecision } from '../interfaces';
import { BaseLoanStateManager } from './base-loan-state-manager';

/**
 * State manager for loans in the 'DisbursingPaused' state.
 * 
 * The DisbursingPaused state occurs when the fund disbursement process has been
 * temporarily suspended due to various business, technical, regulatory, or risk
 * management reasons. This state preserves transaction integrity while allowing
 * for issue resolution.
 */
@Injectable()
export class DisbursingPausedLoanStateManager extends BaseLoanStateManager {
  constructor(domainServices: IDomainServices) {
    super(domainServices, LoanStateCodes.DisbursingPaused);
    this.paymentStrategy = this.getDefaultPaymentStrategy();
  }

  protected getSupportedNextStates(): LoanState[] {
    return [LoanStateCodes.Disbursed, LoanStateCodes.Funded, LoanStateCodes.Disbursing];
  }

  protected getPrimaryPaymentType(): LoanPaymentType {
    return LoanPaymentTypeCodes.Disbursement;
  }

  /**
   * Determines the next state for a loan with paused disbursement operations.
   * 
   * The transition logic evaluates the resolution status of issues that caused
   * the disbursement pause and determines the appropriate next action.
   * 
   * The method coordinates with compliance, operations, risk management, and
   * technical teams to make informed decisions about disbursement resumption.
   * 
   * @param loanId - The unique identifier of the paused loan
   * @returns Promise<LoanState | null> - Returns:
   *   - `LoanStateCodes.Disbursing` if conditions allow resuming disbursement
   *   - `LoanStateCodes.Disbursed` if disbursement completed successfully
   *   - `LoanStateCodes.Funded` if disbursement should be restarted from funded state
   *   - `LoanStateCodes.DisbursingPaused` if pause should continue (no state change)
   *   - `null` if error occurs or if escalation/cancellation is required
   */
   
  protected async getNextState(loanId: string): Promise<LoanState | null> {
    return this.evaluateStateTransition(loanId);
  }

  protected getStateDecisions(): StateDecision[] {
    return [
      {
        condition: (loan) => this.paymentStrategy.shouldTransitionToResumed(loan, EVALUATION_CONTEXT_CODES.DISBURSEMENT.RESUME),
        nextState: LoanStateCodes.Disbursing,
        priority: 1,
      },
      {
        condition: (loan) => this.paymentStrategy.shouldTransitionToCompleted(loan, EVALUATION_CONTEXT_CODES.DISBURSEMENT.COMPLETION),
        nextState: LoanStateCodes.Disbursed,
        priority: 2,
      },
      {
        condition: (loan) => this.paymentStrategy.shouldTransitionToFallback(loan, EVALUATION_CONTEXT_CODES.DISBURSEMENT.FALLBACK),
        nextState: LoanStateCodes.Funded,
        priority: 3,
      },
    ];
  }

  /**
   * Executes the state transition from DisbursingPaused to the determined next state.
   * 
   * This method handles the resumption or redirection of paused disbursement
   * operations with careful attention to maintaining transaction integrity.
   * 
   * The method ensures that resuming disbursement operations maintains the
   * same level of security, compliance, and operational reliability as the
   * original disbursement initiation while accounting for any changes that
   * occurred during the pause period.
   * 
   * @param loanId - The unique identifier of the loan to update
   * @param nextState - The target state to transition the loan to
   * @returns Promise<boolean | null> - Returns:
   *   - `true` if state transition and disbursement resumption completed successfully
   *   - `null` if transition failed or if issues prevent safe resumption
   */
  protected async setNextState(loanId: string, nextState: LoanState): Promise<boolean | null> {
    return this.executeStateTransition(loanId, nextState);
  }
}
