import { IDomainServices } from '@core/modules/domain/idomain.services';
import { LoanPaymentType, LoanPaymentTypeCodes, LoanState, LoanStateCodes } from '@library/entity/enum';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseLoanStateManager } from './base-loan-state-manager';

/**
 * State manager for loans in the 'Repaid' state.
 * 
 * The Repaid state indicates that the borrower has successfully satisfied all
 * loan obligations including principal, interest, and fees. This is a final
 * operational state before loan closure and represents successful loan completion.
 * 
 */
@Injectable()
export class RepaidLoanStateManager extends BaseLoanStateManager {
  constructor(domainServices: IDomainServices) {
    super(domainServices, LoanStateCodes.Repaid);
  }

  /**
   * Determines the next state for a loan that has been fully repaid.
   * 
   * The transition logic validates loan completion and prepares for final closure.
   * 
   * The method typically transitions loans from Repaid to Closed state once
   * all final processing, documentation, and stakeholder communications are complete.
   * In most cases, this transition occurs automatically after validation processes
   * confirm loan satisfaction accuracy and completion of all required procedures.
   * 
   * @param loanId - The unique identifier of the repaid loan
   * @returns Promise<LoanState | null> - Returns:
   *   - `LoanStateCodes.Closed` if all closure requirements are met and loan is ready for archival
   *   - `LoanStateCodes.Repaid` if loan should remain in current state pending final processing
   *   - `null` if an error occurs during validation or if manual intervention is required
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async getNextState(loanId: string): Promise<LoanState | null> {
    // TODO: Implement actual business logic for determining next state
    throw new HttpException('Method not implemented', HttpStatus.NOT_IMPLEMENTED);
  }

  /**
   * Executes the state transition from Repaid to the determined next state.
   * 
   * This method handles the final loan closure process with comprehensive
   * finalization of all loan-related activities.
   * 
   * The method ensures that loan closure maintains strict regulatory compliance,
   * provides complete financial reconciliation, and delivers excellent customer
   * experience while establishing proper archival and documentation retention.
   * 
   * @param loanId - The unique identifier of the loan to update
   * @param nextState - The target state to transition the loan to
   * @returns Promise<boolean | null> - Returns:
   *   - `true` if state transition and loan closure completed successfully
   *   - `null` if transition failed or if issues prevent safe closure completion
   */
  protected async setNextState(loanId: string, nextState: LoanState): Promise<boolean | null> {
    return this.executeStateTransition(loanId, nextState);  
  }

  protected getSupportedNextStates(): LoanState[] {
    // Repaid loans typically transition to Closed
    return [LoanStateCodes.Closed];
  }

  protected getPrimaryPaymentType(): LoanPaymentType {
    // Repaid state deals with the final repayment transactions
    return LoanPaymentTypeCodes.Repayment;
  }
}
