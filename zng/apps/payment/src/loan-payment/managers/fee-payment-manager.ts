import { Injectable } from '@nestjs/common';
import { BaseLoanPaymentManager } from './base-loan-payment-manager';
import { ILoan, ILoanPayment, ILoanPaymentStep, IPaymentsRoute } from '@library/entity/interface';
import { IDomainServices } from '@payment/domain/idomain.services';
import { LoanPaymentTypeCodes } from '@library/entity/enum';
import { DeepPartial } from 'typeorm';

/**
 * Handles loan fee payments
 */
@Injectable()
export class FeePaymentManager extends BaseLoanPaymentManager {
  constructor(protected readonly domainServices: IDomainServices) {
    super(domainServices, LoanPaymentTypeCodes.Fee);
  }

  /**
   * Gets the amount for this payment type from the loan
   * For fee payments, we use the loan's feeAmount property
   * @param loan The loan from which to get the payment amount
   * @returns The payment amount or null for special handling (e.g. zero amount)
   */
  protected getPaymentAmount(loan: ILoan): number | null {
    return loan.feeAmount || 0;
  }

  /**
   * For fee payments, we use all steps from the route
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
    
    // Use all route steps for fee payments
    return this.generateBasePaymentSteps(payment, route, route.steps, fromAccountId, toAccountId);
  }
}
