import { IDomainServices } from '@core/modules/domain/idomain.services';
import { ILoan, ILoanPayment } from '@library/entity/entity-interface';
import { LoanPaymentStateCodes, LoanPaymentTypeCodes, LoanState, LoanStateCodes } from '@library/entity/enum';
import { LOAN_RELATIONS } from '@library/shared/domain/entity/relation';
import { Injectable } from '@nestjs/common';
import { BaseLoanStateManager } from './base-loan-state-manager';

/**
 * Constants for funding evaluation contexts
 */
const EVALUATION_CONTEXTS = {
  COMPLETION: 'Funding completion',
  PAUSE: 'Funding pause',
} as const;

const SUPPORTED_NEXT_STATES: LoanState[] = [
  LoanStateCodes.Funded,
  LoanStateCodes.FundingPaused,
  LoanStateCodes.Accepted,
  LoanStateCodes.Funding,
];

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
    const loan = await this.getLoan(loanId, [LOAN_RELATIONS.Payments]);

    if (!loan) return null;
    const { state } = loan;

    // Avoid usage of Manager for not supported state
    if (state !== this.loanState) {
      this.logger.error(`Loan ${loanId} is not in Funding state. Current state: ${state}`);
      return null; // Loan is not in Funding state, no transition needed
    }

    // Check conditions for transition to `LoanStateCodes.Funded`
    const isFundingComplete = this.shouldBeCompleted(loan);
    if (isFundingComplete) return LoanStateCodes.Funded;
    
    // Check conditions for transition to `LoanStateCodes.FundingPaused`
    const isFundingFailed = this.shouldBePaused(loan);
    if (isFundingFailed) return LoanStateCodes.FundingPaused;

    // Check conditions for transition to `LoanStateCodes.Accepted`
    const isFundingFailedAndNeedsRevert = this.shouldBeReturnedtoAccepted(loan);
    if (isFundingFailedAndNeedsRevert) return LoanStateCodes.Accepted;

    // If no states above reached - keep the `LoanStateCodes.Funding`
    return LoanStateCodes.Funding;
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
    if (!SUPPORTED_NEXT_STATES.includes(nextState)) {
      this.logger.error(`Unsupported next state ${nextState} for loan ${loanId} in Funding state.`);
      return null; // Unsupported state transition
    }
    this.logger.debug(`Setting next state for loan ${loanId} to ${nextState}.`);
    return this.domainServices.loanServices.updateLoan(loanId, { state: nextState });
  }

  /**
   * Determines if funding should be completed based on payment states.
   * 
   * @param loan - The loan to evaluate for completion
   * @returns True if funding should be marked as completed
   */
  private shouldBeCompleted(loan: ILoan): boolean {
    const fundingPayments = this.validateAndGetFundingPayments(loan, EVALUATION_CONTEXTS.COMPLETION);
    if (!fundingPayments) return false;
    const relevantPayment = this.getRelevantFundingPayment(fundingPayments);
    const isCompleted = relevantPayment.state === LoanPaymentStateCodes.Completed;
    this.logPaymentEvaluation(loan.id, EVALUATION_CONTEXTS.COMPLETION, relevantPayment, isCompleted);
    return isCompleted;
  }

  /**
   * Determines if funding should be paused based on payment states.
   * 
   * @param loan - The loan to evaluate for pausing
   * @returns True if funding should be paused
   */
  private shouldBePaused(loan: ILoan): boolean {
    const fundingPayments = this.validateAndGetFundingPayments(loan, EVALUATION_CONTEXTS.PAUSE);
    if (!fundingPayments) return false;
    const relevantPayment = this.getRelevantFundingPayment(fundingPayments);
    const shouldPause = relevantPayment.state === LoanPaymentStateCodes.Failed;
    this.logPaymentEvaluation(loan.id, EVALUATION_CONTEXTS.PAUSE, relevantPayment, shouldPause);
    return shouldPause;
  }

  /**
   * Validates loan payments and extracts funding payments.
   * 
   * @param loan - The loan to validate
   * @param context - The evaluation context for logging
   * @returns Array of funding payments or null if validation fails
   */
  private validateAndGetFundingPayments(loan: ILoan, context: string): ILoanPayment[] | null {
    const { id: loanId, payments } = loan;
    if (!this.validatePaymentsExist(loan, context)) return null;
    const fundingPayments = this.getFundingPayments(payments!);
    if (!this.validateFundingPaymentsExist(loanId, fundingPayments, context)) return null;
    return fundingPayments;
  }

  /**
   * Validates that the loan has payments to evaluate.
   * 
   * @param loan - The loan to validate
   * @param context - The evaluation context for logging
   * @returns True if payments exist and can be evaluated
   */
  private validatePaymentsExist(loan: ILoan, context: string): boolean {
    const { id: loanId, payments } = loan;
    if (!payments || !payments.length) {
      this.logger.warn(`Loan ${loanId} has no payments to evaluate for ${context}.`);
      return false;
    }
    return true;
  }

  /**
   * Filters payments to get only funding-type payments.
   * 
   * @param payments - Array of all loan payments
   * @returns Array of funding payments
   */
  private getFundingPayments(payments: ILoanPayment[]): ILoanPayment[] {
    return payments.filter(payment => payment.type === LoanPaymentTypeCodes.Funding);
  }

  /**
   * Validates that funding payments exist for evaluation.
   * 
   * @param loanId - The loan identifier for logging
   * @param fundingPayments - Array of funding payments
   * @param context - The evaluation context for logging
   * @returns True if funding payments exist
   */
  private validateFundingPaymentsExist(loanId: string, fundingPayments: ILoanPayment[], context: string): boolean {
    if (!fundingPayments || !fundingPayments.length) {
      this.logger.warn(`Loan ${loanId} has no funding payments to evaluate for ${context}.`);
      return false;
    }
    return true;
  }

  /**
   * Gets the most relevant funding payment for evaluation.
   * For single payment, returns that payment. For multiple payments, returns the latest by creation date.
   * 
   * @param fundingPayments - Array of funding payments
   * @returns The most relevant payment for state evaluation
   */
  private getRelevantFundingPayment(fundingPayments: ILoanPayment[]): ILoanPayment {
    if (fundingPayments.length === 1) {
      return fundingPayments[0];
    }
    return fundingPayments.reduce((latest, current) => {
      return (current.createdAt > latest.createdAt) ? current : latest;
    });
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
    this.logger.debug(`Loan ${loanId} funding ${resultText}, payment state: ${payment.state}.`);
  }

  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private shouldBeReturnedtoAccepted(loan: ILoan): boolean {
    // Currently, we do not have a condition to revert funding to Accepted state
    // This might be implemented in the future if business rules change
    return false;
  }
}
