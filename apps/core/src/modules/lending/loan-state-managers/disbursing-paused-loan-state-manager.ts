import { IDomainServices } from '@core/modules/domain/idomain.services';
import { LoanStateCodes } from '@library/entity/enum';
import { Injectable } from '@nestjs/common';
import { EVALUATION_CONTEXT_CODES, StateDecision } from '../interfaces';
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

  /**
   * Defines state transition decisions for the disbursing paused state
   * @returns Array of state decisions with conditions and priorities
   */
  protected getStateDecisions(): StateDecision[] {
    return [
      {
        condition: (loan) => this.paymentStrategy.shouldTransitionToResumed(loan, EVALUATION_CONTEXT_CODES.DISBURSEMENT.RESUME),
        nextState: LoanStateCodes.Disbursing,
        priority: 1,
      },
      {
        condition: (loan) => this.paymentStrategy.shouldTransitionToCompleted(loan, EVALUATION_CONTEXT_CODES.DISBURSEMENT.COMPLETION),
        nextState: LoanStateCodes.Disbursed,
        priority: 2,
      },
      {
        condition: (loan) => this.paymentStrategy.shouldTransitionToFallback(loan, EVALUATION_CONTEXT_CODES.DISBURSEMENT.FALLBACK),
        nextState: LoanStateCodes.Funded,
        priority: 3,
      },
    ];
  }
}
