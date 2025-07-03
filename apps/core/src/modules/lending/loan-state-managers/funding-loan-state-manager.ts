import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { BaseLoanStateManager } from './base-loan-state-manager';
import { LoanState, LoanStateCodes } from '@library/entity/enum';
import { IDomainServices } from '@core/modules/domain/idomain.services';

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async getNextState(loanId: string): Promise<LoanState | null> {
    // TODO: Implement actual business logic for determining next state
    throw new HttpException('Method not implemented', HttpStatus.NOT_IMPLEMENTED);
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async setNextState(loanId: string, nextState: LoanState): Promise<boolean | null> {
    // TODO: Implement actual state transition logic
    throw new HttpException('Method not implemented', HttpStatus.NOT_IMPLEMENTED);
  }
}
