import { IDomainServices } from '@core/modules/domain/idomain.services';
import { ILoan } from '@library/entity/entity-interface';
import { LoanPaymentType, LoanPaymentTypeCodes, LoanState, LoanStateCodes } from '@library/entity/enum';
import { LOAN_RELATIONS } from '@library/shared/domain/entity/relation';
import { Injectable } from '@nestjs/common';
import { BaseLoanStateManager } from './base-loan-state-manager';

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

  protected getSupportedNextStates(): LoanState[] {
    return [LoanStateCodes.Disbursed, LoanStateCodes.DisbursingPaused, LoanStateCodes.Funded];
  }

  protected getPrimaryPaymentType(): LoanPaymentType {
    return LoanPaymentTypeCodes.Disbursement;
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
   
  protected async getNextState(loanId: string): Promise<LoanState | null> {
    const loan = await this.getLoan(loanId, [LOAN_RELATIONS.Payments]);

    if (!loan) return null;

    if (!this.isActualStateValid(loan)) return null;

    // Check conditions for transition to `LoanStateCodes.Disbursed`
    const isDisbursementComplete = this.isPaymentCompleted(loan, this.getPrimaryPaymentType(), 'disbursement completion');
    if (isDisbursementComplete) return LoanStateCodes.Disbursed;

    // Check conditions for transition to `LoanStateCodes.DisbursingPaused`
    const isDisbursementFailed = this.isPaymentFailed(loan, this.getPrimaryPaymentType(), 'disbursement pause');
    if (isDisbursementFailed) return LoanStateCodes.DisbursingPaused;

    // Check conditions for transition to `LoanStateCodes.Funded`
    const isDisbursementFailedAndNeedsRevert = this.shouldBeReturnedToFunded(loan);
    if (isDisbursementFailedAndNeedsRevert) return LoanStateCodes.Funded;

    // If no states above reached - keep the `LoanStateCodes.Disbursing`
    return LoanStateCodes.Disbursing;
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
  protected async setNextState(loanId: string, nextState: LoanState): Promise<boolean | null> {
    return this.executeStateTransition(loanId, nextState);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private shouldBeReturnedToFunded(loan: ILoan): boolean { 
    // Currently, we do not have a condition to revert disbursement to Funded state
    // This might be implemented in the future if business rules change
    return false;
  }
}
