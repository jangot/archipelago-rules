import { IDomainServices } from '@core/modules/domain/idomain.services';
import { LoanStateCodes } from '@library/entity/enum';
import { LOAN_STANDARD_RELATIONS } from '@library/shared/domain/entity/relation';
import { Injectable } from '@nestjs/common';
import { StateDecision } from '../interfaces';
import { BaseLoanStateManager } from './base-loan-state-manager';

/**
 * State manager for loans in the 'Repaid' state.
 * 
 * The Repaid state indicates that the borrower has successfully satisfied all
 * loan obligations including principal, interest, and fees. This is a final
 * operational state before loan closure and represents successful loan completion.
 */
@Injectable()
export class RepaidLoanStateManager extends BaseLoanStateManager {
  constructor(domainServices: IDomainServices) {
    super(domainServices, LoanStateCodes.Repaid);
  }

  /**
   * Gets the required relations for loan evaluation in repaid state
   * @returns Array of loan relations needed for payment evaluation
   */
  protected getRequiredRelations() {
    return [...LOAN_STANDARD_RELATIONS.PAYMENT_EVALUATION];
  }

  /**
   * Defines state transition decisions for the repaid state
   * @returns Array of state decisions with conditions and priorities
   */
  protected getStateDecisions(): StateDecision[] {
    return [
      {
        condition: () => !this.shouldBeHeldInRepaid(),
        nextState: LoanStateCodes.Closed,
        priority: 1,
      }];
  }

  /**
   * Determines if the loan should be held in repaid state before transitioning to closed
   * @returns True if loan should remain in repaid state
   */
  private shouldBeHeldInRepaid(): boolean {
    // Place here any required logic to hold Loan in Repaid state and not transition to Closed
    return false;
  }
}
