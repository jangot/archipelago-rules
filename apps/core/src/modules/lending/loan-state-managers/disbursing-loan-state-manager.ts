import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { BaseLoanStateManager } from './base-loan-state-manager';
import { LoanState, LoanStateCodes } from '@library/entity/enum';
import { IDomainServices } from '@core/domain/idomain.services';

/**
 * State manager for loans in the 'Disbursing' state.
 * 
 * The Disbursing state represents the active process of transferring funds from
 * Zirtue's account to the borrower or designated biller. This is a critical
 * operational state where outbound financial transactions are in progress.
 */
@Injectable()
export class DisbursingLoanStateManager extends BaseLoanStateManager {
  constructor(domainServices: IDomainServices) {
    super(domainServices, LoanStateCodes.Disbursing);
  }

  /**
   * Determines the next state for a loan currently undergoing fund disbursement.
   * 
   * The transition logic monitors the disbursement transaction status and
   * evaluates multiple scenarios to determine the appropriate next state.
   * 
   * @param loanId - The unique identifier of the loan being disbursed
   * @returns Promise<LoanState | null> - Returns:
   *   - `LoanStateCodes.Disbursed` if disbursement completed successfully
   *   - `LoanStateCodes.DisbursingPaused` if disbursement needs to be paused
   *   - `LoanStateCodes.Funded` if disbursement failed and funds should be returned
   *   - `LoanStateCodes.Disbursing` if disbursement should continue (no state change)
   *   - `null` if an error occurs during status evaluation
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async getNextState(loanId: string): Promise<LoanState | null> {
    // TODO: Implement actual business logic for determining next state
    throw new HttpException('Method not implemented', HttpStatus.NOT_IMPLEMENTED);
  }

  /**
   * Executes the state transition from Disbursing to the determined next state.
   * 
   * This method handles the complex orchestration required when transitioning
   * from the Disbursing state, with different behaviors based on the target state.
   * 
   * The method ensures that fund disbursement maintains strict operational
   * controls and provides complete visibility throughout the process.
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
