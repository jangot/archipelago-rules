import { Injectable } from '@nestjs/common';
import { Loan } from '../../../../../../libs/shared/src/domain/entities/loan.entity';
import { BaseLoanPaymentManager } from './base-loan-payment-manager';
import { IDomainServices } from '@core/domain/idomain.services';
import { ILoanPayment } from '@library/entity/interface';

/**
 * Handles loan repayment payments
 */
@Injectable()
export class RepaymentPaymentManager extends BaseLoanPaymentManager {
  constructor(protected readonly domainServices: IDomainServices) {
    super(domainServices);
  }

  /**
   * Initiates a new repayment payment for a loan
   * @param loanId The ID of the loan for which to initiate a repayment payment
   * @returns The created loan payment or null if creation failed
   */
  public async initiate(loanId: string): Promise<ILoanPayment | null> {
    // 1. Check the existance of the payment -> duplicates (except Repayment) throws error
    // 2. Get the Route with it steps
    // 3. Create Payment and Steps -> save & return
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _loanId = loanId; // Prevent unused parameter warning while implementation is pending
    return null; // Implementation needed
  }

  /**
   * Gets information about the next scheduled repayment
   * @param loan The loan to check for next repayment
   * @returns The next scheduled repayment or null if none exists
   */
  public async getNextScheduledRepayment(loan: Loan): Promise<ILoanPayment | null> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _loan = loan; // Prevent unused parameter warning while implementation is pending
    return null; // Implementation needed
  }
}
