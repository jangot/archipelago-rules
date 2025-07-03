import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { BaseLoanStateManager } from './base-loan-state-manager';
import { LoanState, LoanStateCodes } from '@library/entity/enum';
import { IDomainServices } from '@core/modules/domain/idomain.services';

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
   *   - `LoanStateCodes.Repaid` if full payment has been received (early payoff)
   *   - `LoanStateCodes.Disbursed` if loan should remain in current state (no change)
   *   - `null` if an error occurs during evaluation or if special handling required
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async getNextState(loanId: string): Promise<LoanState | null> {
    // TODO: Implement actual business logic for determining next state
    throw new HttpException('Method not implemented', HttpStatus.NOT_IMPLEMENTED);
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async setNextState(loanId: string, nextState: LoanState): Promise<boolean | null> {
    // TODO: Implement actual state transition logic
    throw new HttpException('Method not implemented', HttpStatus.NOT_IMPLEMENTED);
  }
}
