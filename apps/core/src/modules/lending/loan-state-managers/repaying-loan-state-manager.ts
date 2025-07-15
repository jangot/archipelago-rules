import { IDomainServices } from '@core/modules/domain/idomain.services';
import { LoanStateCodes } from '@library/entity/enum';
import { Injectable } from '@nestjs/common';
import { EVALUATION_CONTEXT_CODES, StateDecision } from '../interfaces';
import { BaseLoanStateManager } from './base-loan-state-manager';

/**
 * State manager for loans in the 'Repaying' state.
 * 
 * The Repaying state represents an active loan where the borrower has begun
 * making payments against the loan balance. This is the primary operational
 * state for loans in active repayment with ongoing payment obligations.
 */
@Injectable()
export class RepayingLoanStateManager extends BaseLoanStateManager {
  constructor(domainServices: IDomainServices) {
    super(domainServices, LoanStateCodes.Repaying);
  }

  /**
   * Defines state transition decisions for the repaying state
   * @returns Array of state decisions with conditions and priorities
   */
  protected getStateDecisions(): StateDecision[] {
    return [
      {
        // RepaymentStrategy handles the special "last payment" logic
        condition: (loan) => this.paymentStrategy.shouldTransitionToCompleted(loan, EVALUATION_CONTEXT_CODES.REPAYMENT.COMPLETION),
        nextState: LoanStateCodes.Repaid,
        priority: 1,
      },
      {
        condition: (loan) => this.paymentStrategy.shouldTransitionToPaused(loan, EVALUATION_CONTEXT_CODES.REPAYMENT.PAUSE),
        nextState: LoanStateCodes.RepaymentPaused,
        priority: 2,
      },
      {
        condition: (loan) => this.paymentStrategy.shouldTransitionToFallback(loan, EVALUATION_CONTEXT_CODES.REPAYMENT.FALLBACK),
        nextState: LoanStateCodes.Closed,
        priority: 3,
      },
    ];
  }
}
