import { Injectable } from '@nestjs/common';
import { BaseLoanStateManager } from './base-loan-state-manager';
import { LoanState, LoanStateCodes, PaymentAccountStateCodes } from '@library/entity/enum';
import { IDomainServices } from '@core/domain/idomain.services';
import { LOAN_RELATIONS } from '@library/shared/domain/entities/relations';
import { ILoan } from '@library/entity/interface';

/**
 * State manager for loans in the 'Accepted' state.
 * 
 * The Accepted state occurs when the target user (borrower or lender) has accepted
 * the loan terms and conditions. This is a critical transition point where the loan
 * moves from negotiation/proposal phase to execution phase.
 * 
 * Key responsibilities in this state:
 * - Validate that all required loan parameters are complete
 * - Verify that both parties have valid payment methods
 * - Prepare the loan for funding by setting up necessary workflows
 */
@Injectable()
export class AcceptedLoanStateManager extends BaseLoanStateManager {
  constructor(domainServices: IDomainServices) {
    super(domainServices, LoanStateCodes.Accepted);
  }

  /**
   * Determines the next state for an accepted loan based on business rules and readiness checks.
   * 
   * The transition logic evaluates multiple factors to determine if the loan is ready
   * to move to the Funding state.
   * 
   * If all conditions are met, the loan transitions to 'Funding' state.
   * If any critical checks fail, the loan may need to remain in 'Accepted'
   * state until issues are resolved.
   * 
   * @param loanId - The unique identifier of the loan to evaluate
   * @returns Promise<LoanState | null> - Returns:
   *   - `LoanStateCodes.Funding` if all prerequisites are met and funding can begin
   *   - `LoanStateCodes.Accepted` if the loan should remain in current state
   *   - `null` if an error occurs during evaluation
   */
   
  protected async getNextState(loanId: string): Promise<LoanState | null> {
    const loan = await this.domainServices.loanServices.getLoanById(
      loanId, 
      [
        LOAN_RELATIONS.BillerPaymentAccount, 
        LOAN_RELATIONS.LenderPaymentAccount, 
        LOAN_RELATIONS.BorrowerPaymentAccount, 
      ]);

    // Loan existance check
    if (!loan) {
      this.logger.error(`Loan with ID ${loanId} not found`);
      return null;
    }

    const { state } = loan;

    // Quick return if loan is not in Accepted state
    // Might be changed later to allow re-evaluation
    if (state !== LoanStateCodes.Accepted) {
      this.logger.warn(`Loan ${loanId} is not in Accepted state, current state: ${state}. State advance terminated.`);
      return null;
    }

    const isReadyForFunding = this.canInitiateFunding(loan);
    if (!isReadyForFunding) {
      this.logger.debug(`Loan ${loanId} is not ready for funding initiation. Current state: ${state}.`);
      return LoanStateCodes.Accepted; // Remain in Accepted state
    } 

    return LoanStateCodes.Funding; // Transition to Funding state
  }

  /**
   * Executes the state transition from Accepted to the determined next state.
   * 
   * This method handles the database updates and side effects required when
   * transitioning from the Accepted state.
   * 
   * The method ensures that either all updates succeed or all are rolled back
   * to maintain data integrity.
   * 
   * @param loanId - The unique identifier of the loan to update
   * @param nextState - The target state to transition the loan to
   * @returns Promise<boolean | null> - Returns:
   *   - `true` if the state transition was successful
   *   - `null` if the transition failed and was rolled back
   */
   
  protected async setNextState(loanId: string, nextState: LoanState): Promise<boolean | null> {
    // For now Loan can advance from Advanced to Funding only
    if (nextState !== LoanStateCodes.Funding) {
      this.logger.error(`Invalid state transition from Accepted to ${nextState} for loan ${loanId}. Only Funding is allowed.`);
      return null; // Invalid state transition
    }
    this.logger.debug(`Setting next state for loan ${loanId} to ${nextState} from Accepted state`);
    return this.domainServices.loanServices.updateLoan(loanId, { state: nextState });
  }

  /**
   * Validates if a loan is ready for funding initiation.
   * 
   * Checks that all required entities and payment accounts are present and verified.
   * This includes validation of biller, lender, and borrower accounts with their
   * respective payment account states.
   * 
   * @param loan - The loan entity to validate
   * @returns boolean - True if all funding prerequisites are met, false otherwise
   */
  private canInitiateFunding(loan: ILoan): boolean {
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
}
