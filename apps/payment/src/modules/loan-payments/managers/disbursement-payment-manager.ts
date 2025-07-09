import { ILoan, ILoanPayment, IPaymentsRouteStep } from '@library/entity/entity-interface';
import { LoanPaymentTypeCodes } from '@library/entity/enum';
import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '@payment/modules/domain/services';
import { BaseLoanPaymentManager, PaymentAccountPair } from './base-loan-payment-manager';

/**
 * Handles loan disbursement payments
 */
@Injectable()
export class DisbursementPaymentManager extends BaseLoanPaymentManager {
  constructor(protected readonly paymentDomainService: PaymentDomainService) {
    super(paymentDomainService, LoanPaymentTypeCodes.Disbursement);
  }

  /**
   * Initiates a new disbursement payment for a loan
   * @param loanId The ID of the loan for which to initiate a disbursement payment
   * @returns The created loan payment or null if creation failed
   */
  public async initiate(loanId: string): Promise<ILoanPayment | null> {
    return this.initiatePayment(loanId);
  }

  /**
   * Gets the source and target payment account IDs for disbursement payment
   * @param loan The loan for which to get payment accounts
   * @returns Object containing fromAccountId and toAccountId
   */
  protected async getPaymentAccounts(loan: ILoan): Promise<PaymentAccountPair> {
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
   * Gets the route steps to apply for disbursement payment
   * For Funding + Disbursement route:
   * - If route has a single step, then Disbursement uses all steps
   * - If route has N steps, then Disbursement uses N-1 steps, starting from second
   * @param routeSteps Steps from the payment route
   * @returns The steps to apply for this payment type
   */
  protected getStepsToApply(routeSteps: IPaymentsRouteStep[]): IPaymentsRouteStep[] {
    if (routeSteps.length > 1) {
      return routeSteps.slice(1);
    }
    return routeSteps;
  }
}
