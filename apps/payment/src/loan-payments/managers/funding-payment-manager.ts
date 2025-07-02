import { Injectable } from '@nestjs/common';
import { BaseLoanPaymentManager } from './base-loan-payment-manager';
import { ILoan, ILoanPayment, IPaymentsRouteStep } from '@library/entity/entity-interface';
import { PaymentDomainService } from '@payment/domain/services';
import { LoanPaymentTypeCodes } from '@library/entity/enum';

/**
 * Handles loan funding payments
 */
@Injectable()
export class FundingPaymentManager extends BaseLoanPaymentManager {
  constructor(protected readonly paymentDomainService: PaymentDomainService) {
    super(paymentDomainService, LoanPaymentTypeCodes.Funding);
  }

  /**
   * Initiates a new funding payment for a loan
   * @param loanId The ID of the loan for which to initiate a funding payment
   * @returns The created loan payment or null if creation failed
   */
  public async initiate(loanId: string): Promise<ILoanPayment | null> {
    return this.initiatePayment(loanId);
  }

  /**
   * Gets the source and target payment account IDs for funding payment
   * @param loan The loan for which to get payment accounts
   * @returns Object containing fromAccountId and toAccountId
   */
  protected async getPaymentAccounts(loan: ILoan): Promise<{ fromAccountId: string | null; toAccountId: string | null }> {
    const { lenderAccountId, biller } = loan;
    
    if (!lenderAccountId) {
      this.logger.warn(`Lender account ID is missing for loan ${loan.id}`);
      return { fromAccountId: null, toAccountId: null };
    }

    if (!biller || !biller.paymentAccountId) {
      this.logger.warn(`Biller or Biller's payment Account is missing for loan ${loan.id}`);
      return { fromAccountId: null, toAccountId: null };
    }

    return { 
      fromAccountId: lenderAccountId,
      toAccountId: biller.paymentAccountId,
    };
  }

  /**
   * Gets the route steps to apply for funding payment
   * For Funding + Disbursement route:
   * - If route has a single step, then Funding doesn't use any steps
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
}
