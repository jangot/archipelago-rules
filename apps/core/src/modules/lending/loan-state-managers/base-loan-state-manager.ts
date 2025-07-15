import { IDomainServices } from '@core/modules/domain/idomain.services';
import { ILoan, ILoanPayment } from '@library/entity/entity-interface';
import { LoanPaymentStateCodes, LoanPaymentType, LoanPaymentTypeCodes, LoanState, LoanStateCodes, PaymentAccountStateCodes } from '@library/entity/enum';
import { LOAN_STANDARD_RELATIONS, LoanRelation } from '@library/shared/domain/entity/relation';
import { Injectable, Logger } from '@nestjs/common';
import { ILoanStateManager, IPaymentEvaluationStrategy, StateDecision } from '../interfaces';
import { DisbursementPaymentStrategy, FundingPaymentStrategy, RepaymentStrategy } from './strategy';

@Injectable()
export abstract class BaseLoanStateManager implements ILoanStateManager {
  // #region Properties and Constructor
  
  protected readonly logger: Logger;
  protected readonly loanState: LoanState;
  protected paymentStrategy: IPaymentEvaluationStrategy;

  constructor(protected readonly domainServices: IDomainServices, currentState: LoanState) {
    this.logger = new Logger(BaseLoanStateManager.name);
    this.loanState = currentState;
    this.paymentStrategy = this.getDefaultPaymentStrategy();
  }

  // #endregion

  // #region Public Interface Methods

  /**
   * Advances a loan to its next state in the loan lifecycle workflow
   * @param loanId - The unique identifier of the loan to advance
   * @returns Promise indicating success (true), no change needed (false), or failure (null)
   */
  // TODO: Might require additional generic payload for states handling additional input
  public async advance(loanId: string): Promise<boolean | null> {
    const nextState = await this.getNextState(loanId);
    if (!nextState) {
      this.logger.error(`Failed to determine next state for loan ${loanId}. Current state: ${this.loanState}`);
      return null; // Update failed
    }
    if (nextState === this.loanState) {
      this.logger.debug(`No state change required for loan ${loanId}. Current state: ${this.loanState}`);
      return false; // No updates required
    }
    return this.setNextState(loanId, nextState);
  }

  /**
   * Checks if a payment is completed
   * @param loan - The loan to evaluate
   * @param paymentType - The type of payment to check
   * @param context - Context description for logging
   * @returns True if payment is completed
   */
  public isPaymentCompleted(loan: ILoan, paymentType: LoanPaymentType, context: string): boolean {
    const relevantPayment = this.getStateEvaluationPayment(loan, paymentType, context);
    if (!relevantPayment) {
      this.logger.warn(`No relevant ${paymentType} payment found for loan ${loan.id} during ${context} evaluation.`);
      return false;
    }
    const result = relevantPayment.state === LoanPaymentStateCodes.Completed;
    this.logPaymentResult(loan.id, context, relevantPayment, result, 'completed', 'not completed');
    return result;
  }

  /**
   * Checks if a payment has failed
   * @param loan - The loan to evaluate
   * @param paymentType - The type of payment to check
   * @param context - Context description for logging
   * @returns True if payment has failed
   */
  public isPaymentFailed(loan: ILoan, paymentType: LoanPaymentType, context: string): boolean {
    const relevantPayment = this.getStateEvaluationPayment(loan, paymentType, context);
    if (!relevantPayment) {
      this.logger.warn(`No relevant ${paymentType} payment found for loan ${loan.id} during ${context} evaluation.`);
      return false;
    }
    const result = relevantPayment.state === LoanPaymentStateCodes.Failed;
    this.logPaymentResult(loan.id, context, relevantPayment, result, 'failed', 'not failed');
    return result;
  }

  /**
   * Checks if a payment is pending
   * @param loan - The loan to evaluate
   * @param paymentType - The type of payment to check
   * @param context - Context description for logging
   * @returns True if payment is pending
   */
  public isPaymentPending(loan: ILoan, paymentType: LoanPaymentType, context: string): boolean {
    const relevantPayment = this.getStateEvaluationPayment(loan, paymentType, context);
    if (!relevantPayment) {
      this.logger.warn(`No relevant ${paymentType} payment found for loan ${loan.id} during ${context} evaluation.`);
      return false;
    }
    const result = relevantPayment.state === LoanPaymentStateCodes.Pending;
    this.logPaymentResult(loan.id, context, relevantPayment, result, 'pending', 'not pending');
    return result;
  }

  /**
   * Determines if the current payment is the last payment for the loan
   * @param loan - The loan entity with payment information
   * @returns True if this is the last payment, false otherwise
   */
  public isLastPayment(loan: ILoan): boolean {
    const { paymentsCount } = loan;
    const currentPayment = this.getStateEvaluationPayment(loan, this.getPrimaryPaymentType(), 'last payment check', true);
    if (!currentPayment) {
      this.logger.error(`No current payment found for loan ${loan.id} to check if it is the last payment`);
      return false;
    }
  
    return paymentsCount === currentPayment.paymentNumber;
  }

  // #endregion

  // #region Protected Template Methods for State Management

  /**
   * Determines the next appropriate state for a loan based on current business rules
   * @param loanId - The unique identifier of the loan to evaluate
   * @returns The next state, current state if no transition needed, or null on error
   */
  protected async getNextState(loanId: string): Promise<LoanState | null> {
    return this.evaluateStateTransition(loanId);
  }

  /**
   * Executes the actual state transition by updating the loan's state in the database
   * @param loanId - The unique identifier of the loan to update
   * @param nextState - The target state to transition the loan to
   * @returns Success status or null on failure
   */
  protected async setNextState(loanId: string, nextState: LoanState): Promise<boolean | null> {
    return this.executeStateTransition(loanId, nextState);
  }

  /**
   * Gets the supported next states for this state manager from configuration
   * @returns Array of supported loan states this state can transition to
   */
  protected getSupportedNextStates(): LoanState[] {
    switch (this.loanState) {
      case LoanStateCodes.Accepted:
        return [LoanStateCodes.Funding];
      case LoanStateCodes.Funding:
        return [LoanStateCodes.Funded, LoanStateCodes.FundingPaused, LoanStateCodes.Accepted];
      case LoanStateCodes.FundingPaused:
        return [LoanStateCodes.Funded, LoanStateCodes.Accepted, LoanStateCodes.Funding];
      case LoanStateCodes.Funded:
        return [LoanStateCodes.Accepted, LoanStateCodes.Disbursing];
      case LoanStateCodes.Disbursing:
        return [LoanStateCodes.Disbursed, LoanStateCodes.DisbursingPaused, LoanStateCodes.Funded];
      case LoanStateCodes.DisbursingPaused:
        return [LoanStateCodes.Disbursed, LoanStateCodes.Funded, LoanStateCodes.Disbursing];
      case LoanStateCodes.Disbursed:
        return [LoanStateCodes.Funded, LoanStateCodes.Repaying];
      case LoanStateCodes.Repaying:
        return [LoanStateCodes.Repaid, LoanStateCodes.RepaymentPaused, LoanStateCodes.Closed];
      case LoanStateCodes.RepaymentPaused:
        return [LoanStateCodes.Repaying, LoanStateCodes.Closed, LoanStateCodes.Repaid];
      case LoanStateCodes.Repaid:
        return [LoanStateCodes.Closed];
      case LoanStateCodes.Closed:
      default:
        return [];
    }
  }

  /**
   * Gets the primary payment type associated with this state from configuration
   * @returns The primary payment type for this state
   */
  protected getPrimaryPaymentType(): LoanPaymentType {
    switch (this.loanState) {
      case LoanStateCodes.Accepted:
      case LoanStateCodes.Funding:
      case LoanStateCodes.FundingPaused:
      case LoanStateCodes.Funded:
        return LoanPaymentTypeCodes.Funding;
      case LoanStateCodes.Disbursing:
      case LoanStateCodes.DisbursingPaused:
      case LoanStateCodes.Disbursed:
        return LoanPaymentTypeCodes.Disbursement;
      case LoanStateCodes.Repaying:
      case LoanStateCodes.RepaymentPaused:
      case LoanStateCodes.Repaid:
      case LoanStateCodes.Closed:
        return LoanPaymentTypeCodes.Repayment;
      default:
        return LoanPaymentTypeCodes.Funding;
    }
  }

  /**
   * Gets the required relations for loan evaluation in this state manager
   * @returns Array of loan relations required for proper state evaluation
   */
  protected getRequiredRelations(): LoanRelation[] {
    return [...LOAN_STANDARD_RELATIONS.PAYMENT_EVALUATION]; // Default
  }

  // #endregion

  // #region Protected Helper Methods for State Transitions

  /**
   * Template method for executing state transitions with validation
   * @param loanId - The unique identifier of the loan to update
   * @param nextState - The target state to transition the loan to
   * @returns Success status or null on failure
   */
  protected async executeStateTransition(loanId: string, nextState: LoanState): Promise<boolean | null> {
    if (!this.getSupportedNextStates().includes(nextState)) {
      this.logger.error(`Unsupported next state ${nextState} for loan ${loanId} in ${this.loanState} state.`);
      return null;
    }
    this.logger.debug(`Setting next state for loan ${loanId} to ${nextState}.`);
    return this.domainServices.loanServices.updateLoan(loanId, { state: nextState });
  }

  /**
   * Validates loan and retrieves it with required relations for state evaluation
   * @param loanId - The unique identifier of the loan
   * @returns The validated loan entity or null if validation fails
   */
  protected async validateAndGetLoan(loanId: string): Promise<ILoan | null> {
    const loan = await this.getLoan(loanId, this.getRequiredRelations());
    if (!loan || !this.isActualStateValid(loan)) return null;
    return loan;
  }
  
  /**
   * Evaluates the state transition by checking all decision conditions in priority order
   * @param loanId - The unique identifier of the loan to evaluate
   * @returns The next state or current state if no transition is needed, null on error
   */
  protected async evaluateStateTransition(loanId: string): Promise<LoanState | null> {
    const loan = await this.validateAndGetLoan(loanId);
    if (!loan) return null;
  
    const decisions = this.getStateDecisions();
    for (const decision of decisions.sort((a, b) => a.priority - b.priority)) {
      if (decision.condition(loan)) {
        return decision.nextState;
      }
    }
    
    return this.loanState; // Stay in current state
  }

  // #endregion

  // #region Protected Data Access Methods

  /**
   * Retrieves a loan by ID with optional relations
   * @param loanId - The unique identifier of the loan
   * @param relations - Optional relations to include in the query
   * @returns The loan entity or null if not found
   */
  protected async getLoan(loanId: string, relations?: LoanRelation[]): Promise<ILoan | null> { 
    const loan = await this.domainServices.loanServices.getLoanById(loanId, relations);
    if (!loan) {
      this.logger.error(`Loan with ID ${loanId} not found`);
      return null; // Loan does not exist
    }
    return loan;
  }

  /**
   * Retrieves the latest payment of a specific type for a loan, used for state evaluation
   * @param loan - The loan object containing payment information
   * @param paymentType - The type of payment to evaluate
   * @param evaluationContext - Contextual information for logging purposes
   * @param sortByOrder - Optional flag to sort by paymentNumber instead of createdAt
   * @returns The latest payment of the specified type or null if none found
   */
  protected getStateEvaluationPayment(
    loan: ILoan,
    paymentType: LoanPaymentType,
    evaluationContext: string,
    sortByOrder = false
  ): ILoanPayment | null {
    const { id: loanId, payments } = loan;

    // Check that there are any payments at all
    if (!payments || !payments.length) {
      this.logger.warn(`Loan ${loanId} has no payments to evaluate for ${evaluationContext}.`);
      return null;
    }

    // Filter payments by type and find the latest one
    const typePayments = payments.filter(p => p.type === paymentType);
    if (!typePayments || !typePayments.length) {
      this.logger.warn(`Loan ${loanId} has no ${paymentType} payments to evaluate for ${evaluationContext}.`);
      return null;
    }

    // Default scenario - return the latest payment of the specified type (except repayment)
    if (typePayments.length === 1) {
      return typePayments[0];
    }

    // Multiple payments of the same type
    // Return the one with the latest createdAt date by default
    // If sortByOrder is true, return by highest paymentNumber instead
    if (sortByOrder) {
      return typePayments.reduce((latest, current) => {
        return (current.paymentNumber && latest.paymentNumber && current.paymentNumber > latest.paymentNumber) ? current : latest;
      });
    }

    return typePayments.reduce((latest, current) => {
      return (current.createdAt > latest.createdAt) ? current : latest;
    });
  }

  // #endregion

  // #region Protected Validation Methods

  /**
   * Validates that a loan is in the expected state for this state manager
   * @param loan - The loan entity to validate
   * @returns True if the loan is in the expected state, false otherwise
   */
  protected isActualStateValid(loan: ILoan): boolean {
    const { state, id: loanId } = loan;
    if (state !== this.loanState) {
      this.logger.error(`Loan ${loanId} is not in expected state ${this.loanState}. Current state: ${state}`);
      return false; // Loan is not in the expected state, validation failed
    }
    return true; // Loan is in the expected state, validation passed
  }

  /**
   * Validates if a loan has valid payment accounts connected
   * @param loan - The loan entity to validate
   * @returns True if all prerequisites are met, false otherwise
   */
  protected hasValidAccountsConnected(loan: ILoan): boolean {
    const { id: loanId, billerId, lenderId, borrowerId, biller, lenderAccountId, borrowerAccountId, lenderAccount, borrowerAccount } = loan;
  
    // Validate biller existence
    if (!biller) {
      this.logger.warn(`Loan ${loanId} has no associated biller`);
      return false;
    }
  
    // Validate payment accounts existence
    if (!lenderAccount || !borrowerAccount || !biller.paymentAccount) {
      this.logger.warn(`Loan ${loanId} has missing payment accounts for lender, borrower, or biller`);
      return false;
    }
  
    const { paymentAccountId: billerAccountId } = biller;
    const requiredIds = [billerId, lenderId, borrowerId, billerAccountId, lenderAccountId, borrowerAccountId];
      
    // Check all required IDs are present
    if (requiredIds.some(id => id === null || id === undefined)) {
      this.logger.warn(`Loan ${loanId} has missing required entity IDs`);
      return false;
    }
  
    // Validate payment account states
    const isLenderAccountVerified = lenderAccount.state === PaymentAccountStateCodes.Verified;
    const isBorrowerAccountVerified = borrowerAccount.state === PaymentAccountStateCodes.Verified;
    const isBillerAccountVerified = biller.paymentAccount.state === PaymentAccountStateCodes.Verified;
  
    if (!isLenderAccountVerified || !isBorrowerAccountVerified || !isBillerAccountVerified) {
      this.logger.warn(`Loan ${loanId} has unverified payment accounts - Lender: ${isLenderAccountVerified}, Borrower: ${isBorrowerAccountVerified}, Biller: ${isBillerAccountVerified}`);
      return false;
    }
  
    return true;
  }

  // #endregion

  // #region Protected Utility Methods

  /**
   * Standardized logging for payment evaluation results
   * @param loanId - The loan identifier
   * @param context - The evaluation context description
   * @param payment - The payment that was evaluated
   * @param result - The evaluation result
   * @param positiveAction - Description for positive result
   * @param negativeAction - Description for negative result
   */
  protected logPaymentResult(
    loanId: string, 
    context: string, 
    payment: ILoanPayment, 
    result: boolean,
    positiveAction: string,
    negativeAction: string
  ): void {
    const resultText = result ? positiveAction : negativeAction;
    const paymentType = this.getPrimaryPaymentType().toLowerCase();
    this.logger.debug(`Loan ${loanId} ${paymentType} ${resultText}, payment state: ${payment.state}.`);
  }

  /**
   * Factory method to create appropriate payment strategy based on loan state
   * @returns The appropriate payment evaluation strategy for the current state
   */
  protected getDefaultPaymentStrategy(): IPaymentEvaluationStrategy {
    // Factory method to create appropriate strategy based on state
    switch (this.loanState) {
      case LoanStateCodes.Funding:
      case LoanStateCodes.FundingPaused:
      case LoanStateCodes.Funded:
        return new FundingPaymentStrategy(this);
      case LoanStateCodes.Disbursing:
      case LoanStateCodes.DisbursingPaused:
      case LoanStateCodes.Disbursed:
        return new DisbursementPaymentStrategy(this);
      case LoanStateCodes.Repaying:
      case LoanStateCodes.RepaymentPaused:
      case LoanStateCodes.Repaid:
        return new RepaymentStrategy(this);
      default:
        this.logger.error(`No default payment strategy defined for state ${this.loanState}`);
        throw new Error(`Unsupported loan state: ${this.loanState}`);
    }
  }

  // #endregion

  // #region Abstract Methods

  /**
   * Abstract method to define state transition decisions for concrete implementations
   * @returns Array of state decisions with conditions and priorities
   */
  protected abstract getStateDecisions(): StateDecision[];

  // #endregion
}
