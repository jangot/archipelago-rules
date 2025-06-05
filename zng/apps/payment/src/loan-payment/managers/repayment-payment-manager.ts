import { Injectable } from '@nestjs/common';
import { BaseLoanPaymentManager } from './base-loan-payment-manager';
import { ILoan, ILoanPayment, ILoanPaymentStep, IPaymentsRoute } from '@library/entity/interface';
import { Loan } from '@library/shared/domain/entities';
import { IDomainServices } from '@payment/domain/idomain.services';
import { LoanPaymentTypeCodes } from '@library/entity/enum';
import { DeepPartial } from 'typeorm';

/**
 * Handles loan repayment payments
 */
@Injectable()
export class RepaymentPaymentManager extends BaseLoanPaymentManager {
  constructor(protected readonly domainServices: IDomainServices) {
    super(domainServices, LoanPaymentTypeCodes.Repayment);
  }

  // Repayment payment uses the base template method from BaseLoanPaymentManager
  // TODO: This should be extended to handle multiple repayments in the future

  /**
   * For repayment payments, we use all steps from the route 
   * TODO: In the future, this may need to handle multiple repayments with different schedules
   */
  protected generateStepsForPayment(
    payment: ILoanPayment | null, 
    route: IPaymentsRoute | null, 
    fromAccountId: string, 
    toAccountId: string
  ): DeepPartial<ILoanPaymentStep>[] | null {
    if (!route || !route.steps) {
      return null;
    }
    
    // Use all route steps for repayment payments
    return this.generateBasePaymentSteps(payment, route, route.steps, fromAccountId, toAccountId);
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
