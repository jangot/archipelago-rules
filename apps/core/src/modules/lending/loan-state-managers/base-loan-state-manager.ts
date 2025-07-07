import { IDomainServices } from '@core/modules/domain/idomain.services';
import { ILoan, ILoanPayment } from '@library/entity/entity-interface';
import { LoanPaymentType, LoanState } from '@library/entity/enum';
import { LoanRelation } from '@library/shared/domain/entity/relation';
import { Injectable, Logger } from '@nestjs/common';
import { ILoanStateManager } from '../interfaces';

@Injectable()
export abstract class BaseLoanStateManager implements ILoanStateManager {
  protected readonly logger: Logger;
  protected readonly loanState: LoanState;

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
   * 
   * @param loan - The loan object containing payment information
   * @param paymentType - The type of payment to evaluate (e.g., 'Biller', 'Lender', 'Borrower')
   * @param evaluationContext - Contextual information for logging purposes
   * @returns ILoanPayment | null - Returns:
   *   - The latest payment of the specified type if found
   *   - `null` if no payments of that type exist or if there are no payments at all
   */
  protected getStateEvaluationPayment(loan: ILoan, paymentType: LoanPaymentType, evaluationContext: string): ILoanPayment | null {
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

    // Unexpected (except repayment) but handeled case - multiple payments of the same type
    // Return the one with the latest createdAt date
    // TODO: Align logic for repayments with this logic
    return typePayments.reduce((latest, current) => {
      return (current.createdAt > latest.createdAt) ? current : latest;
    });
  }


}
