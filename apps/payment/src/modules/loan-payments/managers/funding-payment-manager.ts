import { ILoan, IPaymentsRouteStep } from '@library/entity/entity-interface';
import { LoanPaymentTypeCodes } from '@library/entity/enum';
import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '@payment/modules/domain/services';
import { BaseLoanPaymentManager, PaymentAccountPair } from './base-loan-payment-manager';

/**
 * Handles loan funding payments
 */
@Injectable()
export class FundingPaymentManager extends BaseLoanPaymentManager {
  constructor(protected readonly paymentDomainService: PaymentDomainService) {
    super(paymentDomainService, LoanPaymentTypeCodes.Funding);
  }

  protected getAccountPairForPaymentType(loan: ILoan): PaymentAccountPair {
    return { 
      fromAccountId: loan.lenderAccountId,
      toAccountId: loan.biller?.paymentAccountId || null,
    };
  }

  /**
   * Gets the route steps to apply for funding payment
   * For Funding + Disbursement route:
   * - If route has N steps, then Funding uses only the first step
   * @param routeSteps Steps from the payment route
   * @returns The steps to apply for this payment type
   */
  protected getStepsToApply(routeSteps: IPaymentsRouteStep[]): IPaymentsRouteStep[] {
    if (routeSteps.length > 1) {
      return [routeSteps[0]];
    }
    return [];
  }

  protected getPaymentAmount(loan: ILoan): number {
    const { feeAmount, amount } = loan;
    return amount + (feeAmount || 0);
  }
}
