import { Injectable } from '@nestjs/common';
import { BaseLoanPaymentManager } from './base-loan-payment-manager';
import { ILoanPayment } from '@library/entity/interface';
import { IDomainServices } from '@payment/domain/idomain.services';

/**
 * Handles loan refund payments
 */
@Injectable()
export class RefundPaymentManager extends BaseLoanPaymentManager {
  constructor(protected readonly domainServices: IDomainServices) {
    super(domainServices);
  }

  /**
   * Initiates a new refund payment for a loan
   * @param loanId The ID of the loan for which to initiate a refund payment
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
}
