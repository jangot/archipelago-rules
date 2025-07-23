import { IDomainServices } from '@core/modules/domain/idomain.services';
import { LoanStateCodes } from '@library/entity/enum';
import { Injectable } from '@nestjs/common';
import { EVALUATION_CONTEXT_CODES, StateDecision } from '../interfaces';
import { BaseLoanStateManager } from './base-loan-state-manager';

/**
 * State manager for loans in the 'Funding' state.
 * 
 * The Funding state represents the active process of transferring funds from the
 * lender's account to Zirtue's holding account. This is a critical operational
 * state where financial transactions are in progress.
 */
@Injectable()
export class FundingLoanStateManager extends BaseLoanStateManager {
  constructor(domainServices: IDomainServices) {
    super(domainServices, LoanStateCodes.Funding);
  }

  /**
   * Defines state transition decisions for the funding state
   * @returns Array of state decisions with conditions and priorities
   */
  protected getStateDecisions(): StateDecision[] {
    return [
      {
        condition: (loan) => this.paymentStrategy.shouldTransitionToCompleted(loan, EVALUATION_CONTEXT_CODES.FUNDING.COMPLETION),
        nextState: LoanStateCodes.Funded,
        sameStateProgress: false,
        priority: 1,
      },
      {
        condition: (loan) => this.paymentStrategy.shouldTransitionToPaused(loan, EVALUATION_CONTEXT_CODES.FUNDING.PAUSE),
        nextState: LoanStateCodes.FundingPaused,
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
