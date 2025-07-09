import { IDomainServices } from '@core/modules/domain/idomain.services';
import { ILoan } from '@library/entity/entity-interface';
import { LoanPaymentType, LoanPaymentTypeCodes, LoanState, LoanStateCodes } from '@library/entity/enum';
import { LOAN_RELATIONS } from '@library/shared/domain/entity/relation';
import { Injectable } from '@nestjs/common';
import { BaseLoanStateManager } from './base-loan-state-manager';

/**
 * State manager for loans in the 'DisbursingPaused' state.
 * 
 * The DisbursingPaused state occurs when the fund disbursement process has been
 * temporarily suspended due to various business, technical, regulatory, or risk
 * management reasons. This state preserves transaction integrity while allowing
 * for issue resolution.
 */
@Injectable()
export class DisbursingPausedLoanStateManager extends BaseLoanStateManager {
  constructor(domainServices: IDomainServices) {
    super(domainServices, LoanStateCodes.DisbursingPaused);
  }

  protected getSupportedNextStates(): LoanState[] {
    return [LoanStateCodes.Disbursed, LoanStateCodes.Funded, LoanStateCodes.Disbursing];
  }

  protected getPrimaryPaymentType(): LoanPaymentType {
    return LoanPaymentTypeCodes.Disbursement;
  }

  /**
   * Determines the next state for a loan with paused disbursement operations.
   * 
   * The transition logic evaluates the resolution status of issues that caused
   * the disbursement pause and determines the appropriate next action.
   * 
   * The method coordinates with compliance, operations, risk management, and
   * technical teams to make informed decisions about disbursement resumption.
   * 
   * @param loanId - The unique identifier of the paused loan
   * @returns Promise<LoanState | null> - Returns:
   *   - `LoanStateCodes.Disbursing` if conditions allow resuming disbursement
   *   - `LoanStateCodes.Disbursed` if disbursement completed successfully
   *   - `LoanStateCodes.Funded` if disbursement should be restarted from funded state
   *   - `LoanStateCodes.DisbursingPaused` if pause should continue (no state change)
   *   - `null` if error occurs or if escalation/cancellation is required
   */
   
  protected async getNextState(loanId: string): Promise<LoanState | null> {
    const loan = await this.getLoan(loanId, [LOAN_RELATIONS.Payments]);
    
    if (!loan) return null;
    
    if (!this.isActualStateValid(loan)) return null;

    // Check conditions for `LoanStateCodes.Disbursing`
    const isDisbursementResumed = this.isPaymentPending(loan, this.getPrimaryPaymentType(), 'disbursement resume');
    if (isDisbursementResumed) return LoanStateCodes.Disbursing;

    // Check conditions for `LoanStateCodes.Disbursed`
    const isDisbursementCompleted = this.isPaymentCompleted(loan, this.getPrimaryPaymentType(), 'disbursement completion');
    if (isDisbursementCompleted) return LoanStateCodes.Disbursed;

    // Check conditions for `LoanStateCodes.Funded`
    const isDisbursementReturnedToFunded = this.shouldBeReturnedToFunded(loan);
    if (isDisbursementReturnedToFunded) return LoanStateCodes.Funded;

    // If no states above reached - keep the `LoanStateCodes.DisbursingPaused`
    return LoanStateCodes.DisbursingPaused;
  }

  /**
   * Executes the state transition from DisbursingPaused to the determined next state.
   * 
   * This method handles the resumption or redirection of paused disbursement
   * operations with careful attention to maintaining transaction integrity.
   * 
   * The method ensures that resuming disbursement operations maintains the
   * same level of security, compliance, and operational reliability as the
   * original disbursement initiation while accounting for any changes that
   * occurred during the pause period.
   * 
   * @param loanId - The unique identifier of the loan to update
   * @param nextState - The target state to transition the loan to
   * @returns Promise<boolean | null> - Returns:
   *   - `true` if state transition and disbursement resumption completed successfully
   *   - `null` if transition failed or if issues prevent safe resumption
   */
  protected async setNextState(loanId: string, nextState: LoanState): Promise<boolean | null> {
    return this.executeStateTransition(loanId, nextState);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private shouldBeReturnedToFunded(loan: ILoan): boolean { 
    // Currently, we do not have a condition to revert disbursement paused to Funded state
    // This might be implemented in the future if business rules change
    return false;
  }
}
