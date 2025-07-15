import { IDomainServices } from '@core/modules/domain/idomain.services';
import { ILoan } from '@library/entity/entity-interface';
import { LoanPaymentType, LoanPaymentTypeCodes, LoanState, LoanStateCodes } from '@library/entity/enum';
import { LOAN_STANDARD_RELATIONS } from '@library/shared/domain/entity/relation';
import { Injectable } from '@nestjs/common';
import { EVALUATION_CONTEXT_CODES, StateDecision } from '../interfaces';
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
    this.paymentStrategy = this.getDefaultPaymentStrategy();
  }

  protected getSupportedNextStates(): LoanState[] {
    return [LoanStateCodes.Accepted, LoanStateCodes.Disbursing];
  }

  protected getPrimaryPaymentType(): LoanPaymentType {
    return LoanPaymentTypeCodes.Funding;
  }

  protected getRequiredRelations() {
    return [...LOAN_STANDARD_RELATIONS.FULL_EVALUATION]; // Needs both payments and accounts
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
    return this.evaluateStateTransition(loanId);
  }

  protected getStateDecisions(): StateDecision[] {
    return [
      {
        condition: (loan) => this.shouldStartDisbursement(loan),
        nextState: LoanStateCodes.Disbursing,
        priority: 1,
      },
      {
        condition: (loan) => this.paymentStrategy.shouldTransitionToFallback(loan, EVALUATION_CONTEXT_CODES.FUNDING.FALLBACK),
        nextState: LoanStateCodes.Accepted,
        priority: 2,
      },
    ];
  }

  private shouldStartDisbursement(loan: ILoan): boolean {
    const isFundingCompleted = this.paymentStrategy.shouldTransitionToCompleted(loan, EVALUATION_CONTEXT_CODES.FUNDING.COMPLETION);
    const hasValidAccounts = this.hasValidAccountsConnected(loan);
    return isFundingCompleted && hasValidAccounts;
  }

  protected async setNextState(loanId: string, nextState: LoanState): Promise<boolean | null> {
    return this.executeStateTransition(loanId, nextState);
  }
}
