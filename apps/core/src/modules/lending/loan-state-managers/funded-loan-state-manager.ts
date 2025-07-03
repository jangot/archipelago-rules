import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { BaseLoanStateManager } from './base-loan-state-manager';
import { LoanState, LoanStateCodes } from '@library/entity/enum';
import { IDomainServices } from '@core/domain/idomain.services';

/**
 * State manager for loans in the 'Funded' state.
 * 
 * The Funded state indicates that funds have been successfully transferred from
 * the lender to Zirtue's account and are ready for disbursement to the borrower
 * or designated biller. This is a transitional state that prepares for fund distribution.
 */
@Injectable()
export class FundedLoanStateManager extends BaseLoanStateManager {
  constructor(domainServices: IDomainServices) {
    super(domainServices, LoanStateCodes.Funded);
  }

  /**
   * Determines the next state for a loan with successfully received funds.
   * 
   * The transition logic prepares for and initiates the disbursement process
   * by evaluating multiple readiness factors.
   * 
   * @param loanId - The unique identifier of the funded loan
   * @returns Promise<LoanState | null> - Returns:
   *   - `LoanStateCodes.Disbursing` if all conditions are met for fund disbursement
   *   - `LoanStateCodes.DisbursingPaused` if disbursement should be paused for review
   *   - `LoanStateCodes.Funded` if the loan should remain in current state (no change)
   *   - `null` if an error occurs during readiness evaluation
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async getNextState(loanId: string): Promise<LoanState | null> {
    // TODO: Implement actual business logic for determining next state
    throw new HttpException('Method not implemented', HttpStatus.NOT_IMPLEMENTED);
  }

  /**
   * Executes the state transition from Funded to the determined next state.
   * 
   * @param loanId - The unique identifier of the loan to update
   * @param nextState - The target state to transition the loan to
   * @returns Promise<boolean | null> - Returns:
   *   - `true` if the state transition and disbursement initiation completed successfully
   *   - `null` if the transition failed or disbursement could not be initiated safely
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async setNextState(loanId: string, nextState: LoanState): Promise<boolean | null> {
    // TODO: Implement actual state transition logic
    throw new HttpException('Method not implemented', HttpStatus.NOT_IMPLEMENTED);
  }
}
