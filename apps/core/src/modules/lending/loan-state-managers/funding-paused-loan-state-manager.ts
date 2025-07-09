import { IDomainServices } from '@core/modules/domain/idomain.services';
import { ILoan } from '@library/entity/entity-interface';
import { LoanPaymentType, LoanPaymentTypeCodes, LoanState, LoanStateCodes } from '@library/entity/enum';
import { LOAN_RELATIONS } from '@library/shared/domain/entity/relation';
import { Injectable } from '@nestjs/common';
import { BaseLoanStateManager } from './base-loan-state-manager';



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
    return this.executeStateTransition(loanId, nextState);
  }

  /**
   * Determines if funding should be resumed based on payment states.
   * 
   * @param loan - The loan to evaluate for resumption
   * @returns True if funding should be resumed
   */
  private shouldBeResumed(loan: ILoan): boolean {
    return this.isPaymentPending(loan, this.getPrimaryPaymentType(), 'Funding resume');
  }

  /**
   * Determines if funding should be completed based on payment states.
   * 
   * @param loan - The loan to evaluate for completion
   * @returns True if funding should be marked as completed
   */
  private shouldBeCompleted(loan: ILoan): boolean { 
    return this.isPaymentCompleted(loan, this.getPrimaryPaymentType(), 'Funding completion');
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

  protected getSupportedNextStates(): LoanState[] {
    return [LoanStateCodes.Funded, LoanStateCodes.Accepted, LoanStateCodes.Funding];
  }

  protected getPrimaryPaymentType(): LoanPaymentType {
    return LoanPaymentTypeCodes.Funding;
  }
}
