import { IDomainServices } from '@core/modules/domain/idomain.services';
import { ILoan } from '@library/entity/entity-interface';
import { LoanPaymentType, LoanPaymentTypeCodes, LoanState, LoanStateCodes } from '@library/entity/enum';
import { LOAN_RELATIONS } from '@library/shared/domain/entity/relation';
import { Injectable } from '@nestjs/common';
import { BaseLoanStateManager } from './base-loan-state-manager';

/**
 * State manager for loans in the 'Disbursed' state.
 * 
 * The Disbursed state indicates that funds have been successfully transferred
 * to the borrower or designated biller, and the loan is now active with repayment
 * obligations. This is the primary operational state for active loans.
 * 
 */
@Injectable()
export class DisbursedLoanStateManager extends BaseLoanStateManager {
  constructor(domainServices: IDomainServices) {
    super(domainServices, LoanStateCodes.Disbursed);
  }

  protected getSupportedNextStates(): LoanState[] {
    return [LoanStateCodes.Funded, LoanStateCodes.Repaying];
  }

  protected getPrimaryPaymentType(): LoanPaymentType {
    return LoanPaymentTypeCodes.Disbursement;
  }

  /**
   * Determines the next state for a loan that has been successfully disbursed.
   * 
   * The transition logic evaluates the loan's repayment status and timing
   * to determine when the borrower should begin repayment.
   * 
   * The method coordinates with payment systems, loan servicing platforms,
   * and customer management systems to determine optimal repayment initiation timing.
   * 
   * @param loanId - The unique identifier of the disbursed loan
   * @returns Promise<LoanState | null> - Returns:
   *   - `LoanStateCodes.Repaying` if conditions are met to begin repayment process
   *   - `LoanStateCodes.Disbursed` if loan should remain in current state (no change)
   *   - `null` if an error occurs during evaluation or if special handling required
   */
   
  protected async getNextState(loanId: string): Promise<LoanState | null> {
    const loan = await this.getLoan(
      loanId, 
      [
        LOAN_RELATIONS.Payments,
        LOAN_RELATIONS.BillerPaymentAccount, 
        LOAN_RELATIONS.LenderPaymentAccount, 
        LOAN_RELATIONS.BorrowerPaymentAccount, 
      ]);

    if (!loan) return null;

    if (!this.isActualStateValid(loan)) return null;

    // Check conditions for `LoanStateCodes.Repaying`
    const isReadyForRepayment = this.shouldStartRepayment(loan);
    if (isReadyForRepayment) return LoanStateCodes.Repaying;

    // Check conditions for `LoanStateCodes.Funded`
    const isDisbursedReturnedToFunded = this.shouldBeReturnedToFunded(loan);
    if (isDisbursedReturnedToFunded) return LoanStateCodes.Funded;

    // If no states above reached - keep the `LoanStateCodes.Disbursed`
    return LoanStateCodes.Disbursed;
  }

  /**
   * Executes the state transition from Disbursed to the determined next state.
   * 
   * This method handles the activation of loan repayment processes and
   * associated system updates.
   * 
   * The method ensures that loan repayment activation maintains strict
   * operational controls while providing seamless experience for borrowers
   * and comprehensive management capabilities for loan servicing teams.
   * 
   * @param loanId - The unique identifier of the loan to update
   * @param nextState - The target state to transition the loan to
   * @returns Promise<boolean | null> - Returns:
   *   - `true` if state transition and repayment activation completed successfully
   *   - `null` if transition failed or if issues prevent safe activation
   */
  protected async setNextState(loanId: string, nextState: LoanState): Promise<boolean | null> {
    return this.executeStateTransition(loanId, nextState);
  }

  private shouldStartRepayment(loan: ILoan): boolean { 
    // Check if disbursement payment is completed
    const isDisbursementCompleted = this.isPaymentCompleted(loan, this.getPrimaryPaymentType(), 'starting repayment');
    // To ensure that Loan is ready for next state transition - also check that accounts are valid
    const hasValidAccounts = this.hasValidAccountsConnected(loan);
    const isReady = isDisbursementCompleted && hasValidAccounts;
    return isReady;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private shouldBeReturnedToFunded(loan: ILoan): boolean { 
    // Currently, we do not have a condition to revert Disbursed to Funded state
    // This might be implemented in the future if business rules change
    return false;
  }
}
