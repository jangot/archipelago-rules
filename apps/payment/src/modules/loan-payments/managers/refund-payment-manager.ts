import { ILoan, ILoanPayment } from '@library/entity/entity-interface';
import { LoanPaymentStateCodes, LoanPaymentTypeCodes } from '@library/entity/enum';
import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '@payment/modules/domain/services';
import { BaseLoanPaymentManager } from './base-loan-payment-manager';

/**
 * Handles loan refund payments
 */
@Injectable()
export class RefundPaymentManager extends BaseLoanPaymentManager {
  constructor(protected readonly paymentDomainService: PaymentDomainService) {
    super(paymentDomainService, LoanPaymentTypeCodes.Refund);
  }

  /**
   * Gets the source and target payment account IDs for refund payment
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

  protected canInitiatePayment(loan: ILoan): boolean {
    const { id: loanId, payments } = loan;
    
    // Fast return for the first payment initiation
    if (!payments || !payments.length) return true;
    
    // Check already initiated payments
    const initiatedPayments = this.getSameInitiatedPayments(payments);
    if (initiatedPayments && initiatedPayments.length) {
      this.logger.error(`Refund payment already initiated for loan ${loanId}`);
      return false;
    }
    
    // Check payment for existed completion
    const completedPayments = this.getSameCompletedPayments(payments);
    if (completedPayments && completedPayments.length) {
      this.logger.error(`Refund payment already completed for loan ${loanId}`);
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

  // TODO: Requires more sophisticated logic for refund amount
  protected getPaymentAmount(loan: ILoan): number {
    return loan.amount || 0;
  }
}
