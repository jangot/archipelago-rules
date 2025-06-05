import { Injectable } from '@nestjs/common';
import { BaseLoanPaymentManager } from './base-loan-payment-manager';
import { ILoanPayment, ILoanPaymentStep, IPaymentsRoute, IPaymentsRouteStep } from '@library/entity/interface';
import { LoanPaymentTypeCodes } from '@library/entity/enum';
import { IDomainServices } from '@payment/domain/idomain.services';
import { DeepPartial } from 'typeorm';

/**
 * Handles loan disbursement payments
 */
@Injectable()
export class DisbursementPaymentManager extends BaseLoanPaymentManager {
  constructor(protected readonly domainServices: IDomainServices) {
    super(domainServices, LoanPaymentTypeCodes.Disbursement);
  }

  // Disbursement payment implementation uses the base template method

  /**
   * For disbursement payments, we use specific steps from the route
   * Funding + Disbursement specifics:
   * - If route has 1 step: Disbursement uses that step
   * - If route has N steps: Disbursement uses steps 1 through N-1 (all except first)
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

    const { steps: routeSteps } = route;
    const stepsToApply: IPaymentsRouteStep[] = [];
    
    // Disbursement takes the second through last steps in the route
    if (routeSteps.length > 1) {
      stepsToApply.push(...routeSteps.slice(1));
    } else {
      stepsToApply.push(...routeSteps);
    }

    return this.generateBasePaymentSteps(payment, route, stepsToApply, fromAccountId, toAccountId);
  }
}
