import { IDomainServices } from '@core/modules/domain/idomain.services';
import { LoanStateCodes } from '@library/entity/enum';
import { Injectable } from '@nestjs/common';
import { StateDecision } from '../interfaces';
import { BaseLoanStateManager } from './base-loan-state-manager';

/**
 * State manager for loans in the 'Closed' state.
 * 
 * The Closed state represents the final terminal state of a loan's lifecycle.
 * Loans in this state have completed all operational activities and are
 * maintained primarily for historical reference, regulatory compliance,
 * and archival purposes.
 */
@Injectable()
export class ClosedLoanStateManager extends BaseLoanStateManager {
  constructor(domainServices: IDomainServices) {
    super(domainServices, LoanStateCodes.Closed);
  }

  /**
   * Gets the required relations for loan evaluation in closed state
   * @returns Empty array as terminal state needs no relations for evaluation
   */
  protected getRequiredRelations() {
    return []; // Terminal state needs no relations for evaluation
  }

  /**
   * Defines state transition decisions for the closed state
   * @returns Empty array as closed is a terminal state with no transitions
   */
  protected getStateDecisions(): StateDecision[] {
    // Closed is a terminal state - no transitions expected
    // If exceptional cases need to be handled, they would be added here
    return [];
  }
}
