import { IDomainServices } from '@core/modules/domain/idomain.services';
import { LoanStateCodes } from '@library/entity/enum';
import { Loan } from '@library/shared/domain/entity';
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
  }

  /**
   * Gets the required relations for loan evaluation in funded state
   * @returns Array of loan relations needed for both payments and accounts evaluation
   */
  protected getRequiredRelations() {
    return [...LOAN_STANDARD_RELATIONS.FULL_EVALUATION]; // Needs both payments and accounts
  }

  /**
   * Defines state transition decisions for the funded state
   * @returns Array of state decisions with conditions and priorities
   */
  protected getStateDecisions(): StateDecision[] {
    return [
      {
        condition: (loan) => this.shouldStartDisbursement(loan),
        nextState: LoanStateCodes.Disbursing,
        sameStateProgress: false,
        priority: 1,
      },
      {
        condition: (loan) => this.paymentStrategy.shouldTransitionToFallback(loan, EVALUATION_CONTEXT_CODES.FUNDING.FALLBACK),
        nextState: LoanStateCodes.Accepted,
        sameStateProgress: false,
        priority: 2,
      },
    ];
  }

  /**
   * Determines if disbursement should start based on funding completion and account validation
   * @param loan - The loan to evaluate
   * @returns True if disbursement should start
   */
  private shouldStartDisbursement(loan: Loan): boolean {
    const isFundingCompleted = this.paymentStrategy.shouldTransitionToCompleted(loan, EVALUATION_CONTEXT_CODES.FUNDING.COMPLETION);
    const hasValidAccounts = this.hasValidAccountsConnected(loan);
    return isFundingCompleted && hasValidAccounts;
  }
}
