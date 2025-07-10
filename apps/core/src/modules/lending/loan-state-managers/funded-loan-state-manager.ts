import { IDomainServices } from '@core/modules/domain/idomain.services';
import { ILoan } from '@library/entity/entity-interface';
import { LoanPaymentType, LoanPaymentTypeCodes, LoanState, LoanStateCodes } from '@library/entity/enum';
import { LOAN_RELATIONS } from '@library/shared/domain/entity/relation';
import { Injectable } from '@nestjs/common';
import { BaseLoanStateManager } from './base-loan-state-manager';

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

  protected getSupportedNextStates(): LoanState[] {
    return [LoanStateCodes.Accepted, LoanStateCodes.Disbursing];
  }

  protected getPrimaryPaymentType(): LoanPaymentType {
    return LoanPaymentTypeCodes.Funding;
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
   *   - `LoanStateCodes.Funded` if the loan should remain in current state (no change)
   *   - `null` if an error occurs during readiness evaluation
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

    // Check conditions for `LoanStateCodes.Disbursing`
    const isDisbursementReady = this.shouldBeDisbursed(loan);
    if (isDisbursementReady) return LoanStateCodes.Disbursing;

    // Check conditions for `LoanStateCodes.Accepted`
    const isFundedReturnedToAccepted = this.shouldBeReturnedToAccepted(loan);
    if (isFundedReturnedToAccepted) return LoanStateCodes.Accepted;

    // If no states above reached - keep the `LoanStateCodes.Funded`
    return LoanStateCodes.Funded;
  }

  protected async setNextState(loanId: string, nextState: LoanState): Promise<boolean | null> {
    return this.executeStateTransition(loanId, nextState);
  }

  private shouldBeDisbursed(loan: ILoan): boolean { 
    const isDisbursementReadyState = this.isPaymentCompleted(loan, this.getPrimaryPaymentType(), 'starting disbursement');
    // To ensure that Loan is ready for next state transition - also check that accounts are valid
    const hasValidAccounts = this.hasValidAccountsConnected(loan);
    const isDisbursementReady = isDisbursementReadyState && hasValidAccounts;
    return isDisbursementReady;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private shouldBeReturnedToAccepted(loan: ILoan): boolean { 
    // Currently, we do not have a condition to revert Funded to Accepted state
    // This might be implemented in the future if business rules change
    return false;
  }
}
