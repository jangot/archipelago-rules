import { IDomainServices } from '@core/modules/domain/idomain.services';
import { LoanPaymentType, LoanPaymentTypeCodes, LoanState, LoanStateCodes } from '@library/entity/enum';
import { LOAN_RELATIONS } from '@library/shared/domain/entity/relation';
import { Injectable } from '@nestjs/common';
import { BaseLoanStateManager } from './base-loan-state-manager';

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

  protected getSupportedNextStates(): LoanState[] {
    return [LoanStateCodes.Funding];
  }

  protected getPrimaryPaymentType(): LoanPaymentType {
    // Accepted state doesn't have a primary payment type yet, using Funding as the next phase
    return LoanPaymentTypeCodes.Funding;
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
    const loan = await this.getLoan(
      loanId, 
      [
        LOAN_RELATIONS.BillerPaymentAccount, 
        LOAN_RELATIONS.LenderPaymentAccount, 
        LOAN_RELATIONS.BorrowerPaymentAccount, 
      ]);

    // Loan existance check
    // We logged error in base class, so we can return null here
    if (!loan) return null;

    const { state } = loan;

    if (!this.isActualStateValid(loan)) return null;

    const isReadyForFunding = this.hasValidAccountsConnected(loan);
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
    return this.executeStateTransition(loanId, nextState);
  }
}
