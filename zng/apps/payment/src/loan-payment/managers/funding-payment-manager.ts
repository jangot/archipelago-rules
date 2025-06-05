import { Injectable } from '@nestjs/common';
import { BaseLoanPaymentManager } from './base-loan-payment-manager';
import { ILoanPayment, ILoanPaymentStep, IPaymentsRoute, IPaymentsRouteStep } from '@library/entity/interface';
import { IDomainServices } from '@payment/domain/idomain.services';
import { LoanPaymentTypeCodes } from '@library/entity/enum';
import { DeepPartial } from 'typeorm';

/**
 * Handles loan funding payments
 */
@Injectable()
export class FundingPaymentManager extends BaseLoanPaymentManager {
  constructor(protected readonly domainServices: IDomainServices) {
    super(domainServices, LoanPaymentTypeCodes.Funding);
  }

  // Funding payment implementation uses the base template method

  /**
   * For funding payments, we use specific steps from the route
   * Funding + Disbursement specifics:
   * - If route has 1 step: Funding has no steps (all handled by disbursement)
   * - If route has N steps: Funding uses only the first step
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
    
    // Funding takes only the first step in a multi-step route
    if (routeSteps.length > 1) {
      stepsToApply.push(routeSteps[0]);
    }
    
    // If there's only one step, disbursement handles it, and funding has no steps
    if (stepsToApply.length === 0) {
      // Return empty array to indicate successful processing but no steps needed
      return [];
    }

    return this.generateBasePaymentSteps(payment, route, stepsToApply, fromAccountId, toAccountId);
  }
}
