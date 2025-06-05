import { Injectable } from '@nestjs/common';
import { BaseLoanPaymentManager } from './base-loan-payment-manager';
import { ILoanPayment, ILoanPaymentStep, IPaymentsRoute } from '@library/entity/interface';
import { IDomainServices } from '@payment/domain/idomain.services';
import { LoanPaymentTypeCodes } from '@library/entity/enum';
import { DeepPartial } from 'typeorm';

/**
 * Handles loan refund payments
 */
@Injectable()
export class RefundPaymentManager extends BaseLoanPaymentManager {
  constructor(protected readonly domainServices: IDomainServices) {
    super(domainServices, LoanPaymentTypeCodes.Refund);
  }

  /**
   * Refund payment uses the base template method from BaseLoanPaymentManager
   * TODO: Refund requires more sophisticated logic and should be revisited
   * This is a placeholder implementation that may not cover all edge cases.
   */

  /**
   * For refund payments, we use all steps from the route
   * TODO: This may need to be customized for specific refund scenarios
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
    
    // Use all route steps for refund payments
    return this.generateBasePaymentSteps(payment, route, route.steps, fromAccountId, toAccountId);
  }
}
