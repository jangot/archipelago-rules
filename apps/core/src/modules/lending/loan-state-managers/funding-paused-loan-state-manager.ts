import { IDomainServices } from '@core/modules/domain/idomain.services';
import { LoanStateCodes } from '@library/entity/enum';
import { Injectable } from '@nestjs/common';
import { EVALUATION_CONTEXT_CODES, StateDecision } from '../interfaces';
import { BaseLoanStateManager } from './base-loan-state-manager';

/**
 * State manager for loans in the 'FundingPaused' state.
 * 
 * The FundingPaused state occurs when the funding process has been temporarily
 * suspended due to various business, technical, or regulatory reasons. This state
 * preserves the loan's progress while allowing for issue resolution.
 */
@Injectable()
export class FundingPausedLoanStateManager extends BaseLoanStateManager {
  constructor(domainServices: IDomainServices) {
    super(domainServices, LoanStateCodes.FundingPaused);
  }

  /**
   * Defines state transition decisions for the funding paused state
   * @returns Array of state decisions with conditions and priorities
   */
  protected getStateDecisions(): StateDecision[] {
    return [
      {
        condition: (loan) => this.paymentStrategy.shouldTransitionToResumed(loan, EVALUATION_CONTEXT_CODES.FUNDING.RESUME),
        nextState: LoanStateCodes.Funding,
        sameStateProgress: false,
        priority: 1,
      },
      {
        condition: (loan) => this.paymentStrategy.shouldTransitionToCompleted(loan, EVALUATION_CONTEXT_CODES.FUNDING.COMPLETION),
        nextState: LoanStateCodes.Funded,
        sameStateProgress: false,
        priority: 2,
      },
      {
        condition: (loan) => this.paymentStrategy.shouldTransitionToFallback(loan, EVALUATION_CONTEXT_CODES.FUNDING.FALLBACK),
        nextState: LoanStateCodes.Accepted,
        sameStateProgress: false,
        priority: 3,
      },
    ];
  }
}
