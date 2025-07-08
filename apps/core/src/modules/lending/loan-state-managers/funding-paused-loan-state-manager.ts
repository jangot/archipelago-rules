import { IDomainServices } from '@core/modules/domain/idomain.services';
import { ILoan, ILoanPayment } from '@library/entity/entity-interface';
import { LoanPaymentStateCodes, LoanPaymentTypeCodes, LoanState, LoanStateCodes } from '@library/entity/enum';
import { LOAN_RELATIONS } from '@library/shared/domain/entity/relation';
import { Injectable } from '@nestjs/common';
import { BaseLoanStateManager } from './base-loan-state-manager';

/**
 * Constants for funding paused evaluation contexts
 */
const EVALUATION_CONTEXTS = {
  COMPLETION: 'Funding completion',
  RESUME: 'Funding resume',
} as const;

const SUPPORTED_NEXT_STATES: LoanState[] = [
  LoanStateCodes.Funded,
  LoanStateCodes.FundingPaused,
  LoanStateCodes.Accepted,
  LoanStateCodes.Funding,
];

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
    const loan = await this.getLoan(loanId, [LOAN_RELATIONS.Payments]);
    
    if (!loan) return null;
    
    if (!this.isActualStateValid(loan)) return null;

    // Check conditions for `LoanStateCodes.Funding`
    const isFundingResumed = this.shouldBeResumed(loan);
    if (isFundingResumed) return LoanStateCodes.Funding;

    // Check conditions for `LoanStateCodes.Funded`
    const isFundingCompleted = this.shouldBeCompleted(loan);
    if (isFundingCompleted) return LoanStateCodes.Funded;

    // Check conditions for `LoanStateCodes.Accepted`
    const isFundingReturnedToAccepted = this.shouldBeReturnedToAccepted(loan);
    if (isFundingReturnedToAccepted) return LoanStateCodes.Accepted;

    // If no states above reached - keep the `LoanStateCodes.FundingPaused`
    return LoanStateCodes.FundingPaused;
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
    if (!SUPPORTED_NEXT_STATES.includes(nextState)) {
      this.logger.error(`Unsupported next state ${nextState} for loan ${loanId} in FundingPaused state.`);
      return null; // Unsupported state transition
    }
    this.logger.debug(`Setting next state for loan ${loanId} to ${nextState}.`);
    return this.domainServices.loanServices.updateLoan(loanId, { state: nextState });
  }

  /**
   * Determines if funding should be resumed based on payment states.
   * 
   * @param loan - The loan to evaluate for resumption
   * @returns True if funding should be resumed
   */
  private shouldBeResumed(loan: ILoan): boolean {
    const relevantPayment = this.getStateEvaluationPayment(loan, LoanPaymentTypeCodes.Funding, EVALUATION_CONTEXTS.RESUME);
    if (!relevantPayment) {
      this.logger.warn(`No relevant payment found for loan ${loan.id} in FundingPaused state.`);
      return false; // Cannot resume without a relevant payment
    }
    const isPaymentInProgress = relevantPayment.state === LoanPaymentStateCodes.Pending;
    this.logPaymentEvaluation(loan.id, EVALUATION_CONTEXTS.RESUME, relevantPayment, isPaymentInProgress);
    return isPaymentInProgress;
  }

  /**
   * Determines if funding should be completed based on payment states.
   * 
   * @param loan - The loan to evaluate for completion
   * @returns True if funding should be marked as completed
   */
  private shouldBeCompleted(loan: ILoan): boolean { 
    const relevantPayment = this.getStateEvaluationPayment(loan, LoanPaymentTypeCodes.Funding, EVALUATION_CONTEXTS.COMPLETION);
    if (!relevantPayment) {
      this.logger.warn(`No relevant funding payment found for loan ${loan.id} during completion evaluation.`);
      return false; // No payment to evaluate
    }
    const isCompleted = relevantPayment.state === LoanPaymentStateCodes.Completed;
    this.logPaymentEvaluation(loan.id, EVALUATION_CONTEXTS.COMPLETION, relevantPayment, isCompleted);
    return isCompleted;
  }

  /**
   * Determines if funding should be returned to Accepted state.
   * 
   * Currently not implemented as there are no business requirements
   * for reverting from FundingPaused to Accepted state.
   * 
   * @param loan - The loan to evaluate for reversion
   * @returns Always returns false in current implementation
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private shouldBeReturnedToAccepted(loan: ILoan): boolean { 
    // Currently, we do not have a condition to revert funding paused to Accepted state
    // This might be implemented in the future if business rules change
    return false;
  }

  /**
   * Logs the result of payment evaluation with consistent formatting.
   * 
   * @param loanId - The loan identifier
   * @param context - The evaluation context
   * @param payment - The payment that was evaluated
   * @param result - The evaluation result
   */
  private logPaymentEvaluation(loanId: string, context: string, payment: ILoanPayment, result: boolean): void {
    const action = context === EVALUATION_CONTEXTS.COMPLETION ? 'completed' : 'resumed';
    const negativeAction = context === EVALUATION_CONTEXTS.COMPLETION ? 'not completed' : 'not resumed';
    const resultText = result ? action : negativeAction;
    this.logger.debug(`Loan ${loanId} funding ${resultText}, payment state: ${payment.state}.`);
  }
}
