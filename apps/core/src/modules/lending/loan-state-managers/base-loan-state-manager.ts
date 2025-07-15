import { IDomainServices } from '@core/modules/domain/idomain.services';
import { ILoan, ILoanPayment } from '@library/entity/entity-interface';
import { LoanPaymentStateCodes, LoanPaymentType, LoanState, LoanStateCodes, PaymentAccountStateCodes } from '@library/entity/enum';
import { LOAN_STANDARD_RELATIONS, LoanRelation } from '@library/shared/domain/entity/relation';
import { Injectable, Logger } from '@nestjs/common';
import { ILoanStateManager, IPaymentEvaluationStrategy, StateDecision } from '../interfaces';
import { DisbursementPaymentStrategy, FundingPaymentStrategy, RepaymentStrategy } from './strategy';

@Injectable()
export abstract class BaseLoanStateManager implements ILoanStateManager {
  protected readonly logger: Logger;
  protected readonly loanState: LoanState;
  protected paymentStrategy: IPaymentEvaluationStrategy;

  constructor(protected readonly domainServices: IDomainServices, currentState: LoanState) {
    this.logger = new Logger(BaseLoanStateManager.name);
    this.loanState = currentState;
  }

  /**
   * Advances a loan to its next state in the loan lifecycle workflow.
   * 
   * This method orchestrates the state transition process by:
   * 1. Determining the next appropriate state for the loan based on current conditions
   * 2. Validating that a state change is actually required
   * 3. Executing the state transition if necessary
   * 
   * The method implements a safe state transition pattern where it first checks
   * what the next state should be before attempting any modifications. This prevents
   * invalid state transitions and ensures data consistency.
   * 
   * @param loanId - The unique identifier of the loan to advance
   * @returns Promise<boolean | null> - Returns:
   *   - `true` if the loan state was successfully advanced
   *   - `false` if no state change was required (already in correct state)
   *   - `null` if the state advancement failed due to an error
   * 
   * @throws May log errors but does not throw exceptions - returns null on failure
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
   * Determines the next appropriate state for a loan based on current business rules and conditions.
   * 
   * This abstract method must be implemented by concrete state manager classes to define
   * the specific logic for determining state transitions. The implementation should:
   * 
   * 1. Analyze the current loan data (payments, dates, balances, etc.)
   * 2. Apply business rules specific to the current state
   * 3. Evaluate external conditions (payment schedules, grace periods, etc.)
   * 4. Return the appropriate next state or null if no transition is possible
   * 
   * The method should be idempotent - calling it multiple times with the same
   * loan state should return the same result unless external conditions have changed.
   * 
   * @param loanId - The unique identifier of the loan to evaluate
   * @returns Promise<LoanState | null> - Returns:
   *   - A valid `LoanState` enum value representing the next state
   *   - `null` if no valid next state can be determined or if an error occurs
   * 
   * @abstract This method must be implemented by concrete state manager classes
   */
  protected abstract getNextState(loanId: string): Promise<LoanState | null>;

  /**
     * Executes the actual state transition by updating the loan's state in the database.
     * 
     * This abstract method must be implemented by concrete state manager classes to handle
     * the persistence layer updates required for state transitions. The implementation should:
     * 
     * 1. Update the loan entity's state field in the database
     * 2. Record the state transition in audit logs
     * 3. Trigger any side effects required by the new state (notifications, workflows, etc.)
     * 4. Ensure atomicity - either all updates succeed or all are rolled back
     * 5. Handle database constraints and validation errors gracefully
     * 
     * The method should use database transactions to ensure data consistency and
     * should be idempotent where possible to handle retry scenarios.
     * 
     * @param loanId - The unique identifier of the loan to update
     * @param nextState - The target state to transition the loan to
     * @returns Promise<boolean | null> - Returns:
     *   - `true` if the state was successfully updated in the database
     *   - `null` if the update failed due to a database error or constraint violation
     * 
     * @abstract This method must be implemented by concrete state manager classes
     */
  protected abstract setNextState(loanId: string, nextState: LoanState): Promise<boolean | null>;

  /**
   * Abstract methods that must be implemented by concrete state managers
   */

  /**
   * Gets the supported next states for this state manager
   * @returns Array of supported loan states this state can transition to
   */
  protected abstract getSupportedNextStates(): LoanState[];

  /**
   * Gets the primary payment type associated with this state
   * @returns The primary payment type for this state
   */
  protected abstract getPrimaryPaymentType(): LoanPaymentType;

  /**
   * Common helper methods for state transition validation and execution
   */

  /**
   * Template method for executing state transitions with validation
   * Consolidates the common pattern of validation + logging + database update
   * 
   * @param loanId - The unique identifier of the loan to update
   * @param nextState - The target state to transition the loan to
   * @returns Promise<boolean | null> - Success status or null on failure
   */
  protected async executeStateTransition(loanId: string, nextState: LoanState): Promise<boolean | null> {
    if (!this.getSupportedNextStates().includes(nextState)) {
      this.logger.error(`Unsupported next state ${nextState} for loan ${loanId} in ${this.loanState} state.`);
      return null;
    }
    this.logger.debug(`Setting next state for loan ${loanId} to ${nextState}.`);
    return this.domainServices.loanServices.updateLoan(loanId, { state: nextState });
  }

  protected async getLoan(loanId: string, relations?: LoanRelation[]): Promise<ILoan | null> { 
    const loan = await this.domainServices.loanServices.getLoanById(loanId, relations);
    if (!loan) {
      this.logger.error(`Loan with ID ${loanId} not found`);
      return null; // Loan does not exist
    }
    return loan;
  };

  /**
   * Retrieves the latest payment of a specific type for a loan, used for state evaluation.
   * 
   * This method filters the loan's payments to find the most recent payment of the specified type.
   * It is used to evaluate the current state of the loan based on its payment history.
   * The method can sort by either creation date (default) or payment order number.
   * 
   * @param loan - The loan object containing payment information
   * @param paymentType - The type of payment to evaluate (e.g., 'Biller', 'Lender', 'Borrower')
   * @param evaluationContext - Contextual information for logging purposes
   * @param sortByOrder - Optional flag to sort by paymentNumber instead of createdAt (default: false)
   * @returns ILoanPayment | null - Returns:
   *   - The latest payment of the specified type if found (by createdAt or paymentNumber)
   *   - `null` if no payments of that type exist or if there are no payments at all
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

    // Deefault scenario - return the latest payment of the specified type (except repayment)
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

  protected isActualStateValid(loan: ILoan): boolean {
    const { state, id: loanId } = loan;
    if (state !== this.loanState) {
      this.logger.error(`Loan ${loanId} is not in expected state ${this.loanState}. Current state: ${state}`);
      return false; // Loan is not in the expected state, validation failed
    }
    return true; // Loan is in the expected state, validation passed
  }

  /**
   * Validates if a loan has valid Payment Accounts connected
   * 
   * Checks that all required entities and payment accounts are present and verified.
   * This includes validation of biller, lender, and borrower accounts with their
   * respective payment account states.
   * 
   * @param loan - The loan entity to validate
   * @returns boolean - True if all prerequisites are met, false otherwise
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

  /**
   * Common payment evaluation methods
   */

  /**
   * Checks if a payment is completed
   * 
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
   * 
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
   * 
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
   * Determines if the current payment is the last payment for the loan.
   * 
   * @param loan - The loan entity with payment information
   * @returns boolean - True if this is the last payment, false otherwise
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

  protected shouldAllowFallbackTransition(loan: ILoan, targetState: LoanState): boolean {
    this.logger.debug(`Fallback transition to ${targetState} not implemented for ${this.loanState} state`);
    return false;
  }

  /**
   * Standardized logging for payment evaluation results
   * 
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

  protected setPaymentStrategy(strategy: IPaymentEvaluationStrategy): void {
    this.paymentStrategy = strategy;
  }
  
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

  protected async validateAndGetLoan(loanId: string): Promise<ILoan | null> {
    const loan = await this.getLoan(loanId, this.getRequiredRelations());
    if (!loan || !this.isActualStateValid(loan)) return null;
    return loan;
  }
  
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
  
  protected abstract getStateDecisions(): StateDecision[];
  
  protected getRequiredRelations(): LoanRelation[] {
    return [...LOAN_STANDARD_RELATIONS.PAYMENT_EVALUATION]; // Default
  }
  
}
