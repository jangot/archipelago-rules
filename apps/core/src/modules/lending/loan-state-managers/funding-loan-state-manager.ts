import { IDomainServices } from '@core/modules/domain/idomain.services';
import { ILoan } from '@library/entity/entity-interface';
import { LoanPaymentType, LoanPaymentTypeCodes, LoanState, LoanStateCodes } from '@library/entity/enum';
import { LOAN_RELATIONS } from '@library/shared/domain/entity/relation';
import { Injectable } from '@nestjs/common';
import { BaseLoanStateManager } from './base-loan-state-manager';



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

  protected getSupportedNextStates(): LoanState[] {
    return [LoanStateCodes.Funded, LoanStateCodes.FundingPaused, LoanStateCodes.Accepted];
  }

  protected getPrimaryPaymentType(): LoanPaymentType {
    return LoanPaymentTypeCodes.Funding;
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

    if (!this.isActualStateValid(loan)) return null;

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
    return this.executeStateTransition(loanId, nextState);
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
   * Determines if funding should be paused based on payment states.
   * 
   * @param loan - The loan to evaluate for pausing
   * @returns True if funding should be paused
   */
  private shouldBePaused(loan: ILoan): boolean {
    return this.isPaymentFailed(loan, this.getPrimaryPaymentType(), 'Funding pause');
  }

  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private shouldBeReturnedtoAccepted(loan: ILoan): boolean {
    // Currently, we do not have a condition to revert funding to Accepted state
    // This might be implemented in the future if business rules change
    return false;
  }
}
