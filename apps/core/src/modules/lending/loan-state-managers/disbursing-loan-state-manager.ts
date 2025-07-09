import { IDomainServices } from '@core/modules/domain/idomain.services';
import { ILoan, ILoanPayment } from '@library/entity/entity-interface';
import { LoanPaymentStateCodes, LoanPaymentTypeCodes, LoanState, LoanStateCodes } from '@library/entity/enum';
import { LOAN_RELATIONS } from '@library/shared/domain/entity/relation';
import { Injectable } from '@nestjs/common';
import { BaseLoanStateManager } from './base-loan-state-manager';

/**
 * Constants for disbursement evaluation contexts
 */
const EVALUATION_CONTEXTS = {
  COMPLETION: 'Disbursement completion',
  PAUSE: 'Disbursement pause',
} as const;

const SUPPORTED_NEXT_STATES: LoanState[] = [
  LoanStateCodes.Disbursed,
  LoanStateCodes.DisbursingPaused,
  LoanStateCodes.Funded,
];

/**
 * State manager for loans in the 'Disbursing' state.
 * 
 * The Disbursing state represents the active process of transferring funds from
 * Zirtue's account to the borrower or designated biller. This is a critical
 * operational state where outbound financial transactions are in progress.
 */
@Injectable()
export class DisbursingLoanStateManager extends BaseLoanStateManager {
  constructor(domainServices: IDomainServices) {
    super(domainServices, LoanStateCodes.Disbursing);
  }

  /**
   * Determines the next state for a loan currently undergoing fund disbursement.
   * 
   * The transition logic monitors the disbursement transaction status and
   * evaluates multiple scenarios to determine the appropriate next state.
   * 
   * @param loanId - The unique identifier of the loan being disbursed
   * @returns Promise<LoanState | null> - Returns:
   *   - `LoanStateCodes.Disbursed` if disbursement completed successfully
   *   - `LoanStateCodes.DisbursingPaused` if disbursement needs to be paused
   *   - `LoanStateCodes.Funded` if disbursement failed and funds should be returned
   *   - `LoanStateCodes.Disbursing` if disbursement should continue (no state change)
   *   - `null` if an error occurs during status evaluation
   */
   
  protected async getNextState(loanId: string): Promise<LoanState | null> {
    const loan = await this.getLoan(loanId, [LOAN_RELATIONS.Payments]);

    if (!loan) return null;

    if (!this.isActualStateValid(loan)) return null;

    // Check conditions for transition to `LoanStateCodes.Disbursed`
    const isDisbursementComplete = this.shouldBeCompleted(loan);
    if (isDisbursementComplete) return LoanStateCodes.Disbursed;

    // Check conditions for transition to `LoanStateCodes.DisbursingPaused`
    const isDisbursementFailed = this.shouldBePaused(loan);
    if (isDisbursementFailed) return LoanStateCodes.DisbursingPaused;

    // Check conditions for transition to `LoanStateCodes.Funded`
    const isDisbursementFailedAndNeedsRevert = this.shouldBeReturnedToFunded(loan);
    if (isDisbursementFailedAndNeedsRevert) return LoanStateCodes.Funded;

    // If no states above reached - keep the `LoanStateCodes.Disbursing`
    return LoanStateCodes.Disbursing;
  }

  /**
   * Executes the state transition from Disbursing to the determined next state.
   * 
   * This method handles the complex orchestration required when transitioning
   * from the Disbursing state, with different behaviors based on the target state.
   * 
   * The method ensures that fund disbursement maintains strict operational
   * controls and provides complete visibility throughout the process.
   * 
   * @param loanId - The unique identifier of the loan to update
   * @param nextState - The target state to transition the loan to
   * @returns Promise<boolean | null> - Returns:
   *   - `true` if the state transition completed successfully
   *   - `null` if the transition failed and appropriate rollback was executed
   */
  protected async setNextState(loanId: string, nextState: LoanState): Promise<boolean | null> {
    if (!SUPPORTED_NEXT_STATES.includes(nextState)) {
      this.logger.error(`Unsupported next state ${nextState} for loan ${loanId} in Disbursement state.`);
      return null; // Unsupported state transition
    }
    this.logger.debug(`Setting next state for loan ${loanId} to ${nextState}.`);
    return this.domainServices.loanServices.updateLoan(loanId, { state: nextState });
  }

  private shouldBeCompleted(loan: ILoan): boolean { 
    const relevantPayment = this.getStateEvaluationPayment(loan, LoanPaymentTypeCodes.Disbursement, EVALUATION_CONTEXTS.COMPLETION);
    if (!relevantPayment) {
      this.logger.warn(`No relevant payment found for loan ${loan.id} in Disbursement completion context.`);
      return false;
    }
    const isCompleted = relevantPayment.state === LoanPaymentStateCodes.Completed;
    this.logPaymentEvaluation(loan.id, EVALUATION_CONTEXTS.COMPLETION, relevantPayment, isCompleted);
    return isCompleted;
  }

  private shouldBePaused(loan: ILoan): boolean {
    const relevantPayment = this.getStateEvaluationPayment(loan, LoanPaymentTypeCodes.Disbursement, EVALUATION_CONTEXTS.PAUSE);
    if (!relevantPayment) {
      this.logger.warn(`No relevant payment found for loan ${loan.id} in Disbursement pause context.`);
      return false;
    }
    const isPaused = relevantPayment.state === LoanPaymentStateCodes.Failed;
    this.logPaymentEvaluation(loan.id, EVALUATION_CONTEXTS.PAUSE, relevantPayment, isPaused);
    return isPaused;
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private shouldBeReturnedToFunded(loan: ILoan): boolean { 
    // Currently, we do not have a condition to revert disbursement to Funded state
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
    const action = context === EVALUATION_CONTEXTS.COMPLETION ? 'completed' : 'paused';
    const negativeAction = context === EVALUATION_CONTEXTS.COMPLETION ? 'not completed' : 'not paused';
    const resultText = result ? action : negativeAction;
    this.logger.debug(`Loan ${loanId} disbursement ${resultText}, payment state: ${payment.state}.`);
  }
}
