import { IDomainServices } from '@core/modules/domain/idomain.services';
import { LoanStateCodes } from '@library/entity/enum';
import { Injectable } from '@nestjs/common';
import { EVALUATION_CONTEXT_CODES, StateDecision } from '../interfaces';
import { BaseLoanStateManager } from './base-loan-state-manager';

/**
 * State manager for loans in the 'Disbursing' state.
 * 
 * The Disbursing state represents the active process of transferring funds from
 * Zirtue's account to the borrower or designated biller. This is a critical
 * operational state where outbound financial transactions are in progress.
 */
@Injectable()
export class DisbursingLoanStateManager extends BaseLoanStateManager {
  constructor(domainServices: IDomainServices) {
    super(domainServices, LoanStateCodes.Disbursing);
  }

  /**
   * Defines state transition decisions for the disbursing state
   * @returns Array of state decisions with conditions and priorities
   */
  protected getStateDecisions(): StateDecision[] {
    return [
      {
        condition: (loan) => this.paymentStrategy.shouldTransitionToCompleted(loan, EVALUATION_CONTEXT_CODES.DISBURSEMENT.COMPLETION),
        nextState: LoanStateCodes.Disbursed,
        sameStateProgress: false,
        priority: 1,
      },
      {
        condition: (loan) => this.paymentStrategy.shouldTransitionToPaused(loan, EVALUATION_CONTEXT_CODES.DISBURSEMENT.PAUSE),
        nextState: LoanStateCodes.DisbursingPaused,
        sameStateProgress: false,
        priority: 2,
      },
      {
        condition: (loan) => this.paymentStrategy.shouldTransitionToFallback(loan, EVALUATION_CONTEXT_CODES.DISBURSEMENT.FALLBACK),
        nextState: LoanStateCodes.Funded,
        sameStateProgress: false,
        priority: 3,
      },
    ];
  }
}
