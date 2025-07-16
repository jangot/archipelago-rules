import { ILoan, ILoanPayment, IPaymentsRouteStep } from '@library/entity/entity-interface';
import { LoanPaymentStateCodes, LoanPaymentTypeCodes } from '@library/entity/enum';
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

  protected canInitiatePayment(loan: ILoan): boolean {
    const { id: loanId, payments } = loan;

    // Fast return for the first payment initiation
    if (!payments || !payments.length) return true;

    // Check already initiated payments
    const initiatedPayments = this.getSameInitiatedPayments(payments);
    if (initiatedPayments && initiatedPayments.length) {
      this.logger.error(`Disbursement payment already initiated for loan ${loanId}`);
      return false;
    }

    // Check payment for existed completion
    const completedPayments = this.getSameCompletedPayments(payments);
    if (completedPayments && completedPayments.length) {
      this.logger.error(`Disbursement payment already completed for loan ${loanId}`);
      return false;
    }

    return true;
  }

  protected calculateNewPayment(loan: ILoan): Partial<ILoanPayment> | null {
    const { id: loanId } = loan;
    const amount = this.getPaymentAmount(loan);
    // TODO: Attemts calc goes here
    return {
      amount,
      loanId,
      type: this.paymentType,
      state: LoanPaymentStateCodes.Created,
      scheduledAt: new Date(),
    };
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
