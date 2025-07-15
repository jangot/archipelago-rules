import { IDomainServices } from '@core/modules/domain/idomain.services';
import { LoanStateCodes } from '@library/entity/enum';
import { LOAN_STANDARD_RELATIONS } from '@library/shared/domain/entity/relation';
import { Injectable } from '@nestjs/common';
import { StateDecision } from '../interfaces';
import { BaseLoanStateManager } from './base-loan-state-manager';

/**
 * State manager for loans in the 'Accepted' state.
 * 
 * The Accepted state occurs when the target user (borrower or lender) has accepted
 * the loan terms and conditions. This is a critical transition point where the loan
 * moves from negotiation/proposal phase to execution phase.
 * 
 * Key responsibilities in this state:
 * - Validate that all required loan parameters are complete
 * - Verify that both parties have valid payment methods
 * - Prepare the loan for funding by setting up necessary workflows
 */
@Injectable()
export class AcceptedLoanStateManager extends BaseLoanStateManager {
  constructor(domainServices: IDomainServices) {
    super(domainServices, LoanStateCodes.Accepted);
  }

  /**
   * Gets the required relations for loan evaluation in accepted state
   * @returns Array of loan relations needed for account validation
   */
  protected getRequiredRelations() {
    return [...LOAN_STANDARD_RELATIONS.ACCOUNT_VALIDATION]; // Only needs account validation
  }

  /**
   * Defines state transition decisions for the accepted state
   * @returns Array of state decisions with conditions and priorities
   */
  protected getStateDecisions(): StateDecision[] {
    return [
      {
        condition: (loan) => this.hasValidAccountsConnected(loan),
        nextState: LoanStateCodes.Funding,
        priority: 1,
      },
    ];
  }
}
