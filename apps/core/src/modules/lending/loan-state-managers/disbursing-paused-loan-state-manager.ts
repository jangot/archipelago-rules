import { IDomainServices } from '@core/modules/domain/idomain.services';
import { ILoan, ILoanPayment } from '@library/entity/entity-interface';
import { LoanPaymentStateCodes, LoanPaymentTypeCodes, LoanState, LoanStateCodes } from '@library/entity/enum';
import { LOAN_RELATIONS } from '@library/shared/domain/entity/relation';
import { Injectable } from '@nestjs/common';
import { BaseLoanStateManager } from './base-loan-state-manager';

/**
 * Constants for disbursement paused evaluation contexts
 */
const EVALUATION_CONTEXTS = {
  COMPLETION: 'Disbursement completion',
  RESUME: 'Disbursement resume',
} as const;

const SUPPORTED_NEXT_STATES: LoanState[] = [
  LoanStateCodes.Disbursed,
  LoanStateCodes.Funded,
  LoanStateCodes.Disbursing,
];

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
    const loan = await this.getLoan(loanId, [LOAN_RELATIONS.Payments]);
    
    if (!loan) return null;
    
    if (!this.isActualStateValid(loan)) return null;

    // Check conditions for `LoanStateCodes.Disbursing`
    const isDisbursementResumed = this.shouldBeResumed(loan);
    if (isDisbursementResumed) return LoanStateCodes.Disbursing;

    // Check conditions for `LoanStateCodes.Funded`
    const isDisbursementCompleted = this.shouldBeCompleted(loan);
    if (isDisbursementCompleted) return LoanStateCodes.Disbursed;

    // Check conditions for `LoanStateCodes.Accepted`
    const isDisbursementReturnedToFunded = this.shouldBeReturnedToFunded(loan);
    if (isDisbursementReturnedToFunded) return LoanStateCodes.Funded;

    // If no states above reached - keep the `LoanStateCodes.FundingPaused`
    return LoanStateCodes.DisbursingPaused;
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
    if (!SUPPORTED_NEXT_STATES.includes(nextState)) {
      this.logger.error(`Unsupported next state ${nextState} for loan ${loanId} in DisbursingPaused state.`);
      return null; // Unsupported state transition
    }
    this.logger.debug(`Setting next state for loan ${loanId} to ${nextState}.`);
    return this.domainServices.loanServices.updateLoan(loanId, { state: nextState });
  }

  private shouldBeResumed(loan: ILoan): boolean {
    const relevantPayment = this.getStateEvaluationPayment(loan, LoanPaymentTypeCodes.Disbursement, EVALUATION_CONTEXTS.RESUME);
    if (!relevantPayment) {
      this.logger.warn(`No relevant payment found for loan ${loan.id} in DisbursingPaused state.`);
      return false; // Cannot resume without a relevant payment
    }
    const isPaymentInProgress = relevantPayment.state === LoanPaymentStateCodes.Pending;
    this.logPaymentEvaluation(loan.id, EVALUATION_CONTEXTS.RESUME, relevantPayment, isPaymentInProgress);
    return isPaymentInProgress;
  }

  private shouldBeCompleted(loan: ILoan): boolean { 
    const relevantPayment = this.getStateEvaluationPayment(loan, LoanPaymentTypeCodes.Disbursement, EVALUATION_CONTEXTS.COMPLETION);
    if (!relevantPayment) {
      this.logger.warn(`No relevant disbursement payment found for loan ${loan.id} during completion evaluation.`);
      return false; // No payment to evaluate
    }
    const isCompleted = relevantPayment.state === LoanPaymentStateCodes.Completed;
    this.logPaymentEvaluation(loan.id, EVALUATION_CONTEXTS.COMPLETION, relevantPayment, isCompleted);
    return isCompleted;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private shouldBeReturnedToFunded(loan: ILoan): boolean { 
    // Currently, we do not have a condition to revert disbursement paused to Funded state
    // This might be implemented in the future if business rules change
    return false;
  }
  
  private logPaymentEvaluation(loanId: string, context: string, payment: ILoanPayment, result: boolean): void {
    const action = context === EVALUATION_CONTEXTS.COMPLETION ? 'completed' : 'resumed';
    const negativeAction = context === EVALUATION_CONTEXTS.COMPLETION ? 'not completed' : 'not resumed';
    const resultText = result ? action : negativeAction;
    this.logger.debug(`Loan ${loanId} disbursement ${resultText}, payment state: ${payment.state}.`);
  }
}
