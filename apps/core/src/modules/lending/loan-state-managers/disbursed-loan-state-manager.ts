import { IDomainServices } from '@core/modules/domain/idomain.services';
import { LoanStateCodes } from '@library/entity/enum';
import { LOAN_STANDARD_RELATIONS } from '@library/shared/domain/entity/relation';
import { Injectable } from '@nestjs/common';
import { EVALUATION_CONTEXT_CODES, StateDecision } from '../interfaces';
import { BaseLoanStateManager } from './base-loan-state-manager';
import { Loan } from '@library/shared/domain/entity';

/**
 * State manager for loans in the 'Disbursed' state.
 * 
 * The Disbursed state indicates that funds have been successfully transferred
 * to the borrower or designated biller, and the loan is now active with repayment
 * obligations. This is the primary operational state for active loans.
 */
@Injectable()
export class DisbursedLoanStateManager extends BaseLoanStateManager {
  constructor(domainServices: IDomainServices) {
    super(domainServices, LoanStateCodes.Disbursed);
  }

  /**
   * Gets the required relations for loan evaluation in disbursed state
   * @returns Array of loan relations needed for both payments and accounts evaluation
   */
  protected getRequiredRelations() {
    return [...LOAN_STANDARD_RELATIONS.FULL_EVALUATION]; // Needs both payments and accounts
  }

  /**
   * Defines state transition decisions for the disbursed state
   * @returns Array of state decisions with conditions and priorities
   */
  protected getStateDecisions(): StateDecision[] {
    return [
      {
        condition: (loan) => this.shouldStartRepayment(loan),
        nextState: LoanStateCodes.Repaying,
        priority: 1,
      },
      {
        condition: (loan) => this.paymentStrategy.shouldTransitionToFallback(loan, EVALUATION_CONTEXT_CODES.DISBURSEMENT.FALLBACK),
        nextState: LoanStateCodes.Funded,
        priority: 2,
      },
    ];
  }

  /**
   * Determines if repayment should start based on disbursement completion and account validation
   * @param loan - The loan to evaluate
   * @returns True if repayment should start
   */
  private shouldStartRepayment(loan: Loan): boolean {
    const isDisbursementCompleted = this.paymentStrategy.shouldTransitionToCompleted(loan, EVALUATION_CONTEXT_CODES.DISBURSEMENT.COMPLETION);
    const hasValidAccounts = this.hasValidAccountsConnected(loan);
    return isDisbursementCompleted && hasValidAccounts;
  }
}
