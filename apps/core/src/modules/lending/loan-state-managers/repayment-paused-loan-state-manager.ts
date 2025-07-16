import { IDomainServices } from '@core/modules/domain/idomain.services';
import { LoanStateCodes } from '@library/entity/enum';
import { Injectable } from '@nestjs/common';
import { EVALUATION_CONTEXT_CODES, StateDecision } from '../interfaces';
import { BaseLoanStateManager } from './base-loan-state-manager';

/**
 * State manager for loans in the 'RepaymentPaused' state.
 * 
 * The RepaymentPaused state occurs when the loan repayment process has been
 * temporarily suspended due to borrower hardship, loan modification processes,
 * technical issues, or other circumstances requiring payment suspension.
 */
@Injectable()
export class RepaymentPausedLoanStateManager extends BaseLoanStateManager {
  constructor(domainServices: IDomainServices) {
    super(domainServices, LoanStateCodes.RepaymentPaused);
  }

  /**
   * Defines state transition decisions for the repayment paused state
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
        condition: (loan) => this.paymentStrategy.shouldTransitionToResumed(loan, EVALUATION_CONTEXT_CODES.REPAYMENT.RESUME),
        nextState: LoanStateCodes.Repaying,
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
