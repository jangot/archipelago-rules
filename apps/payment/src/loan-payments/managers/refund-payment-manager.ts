import { Injectable } from '@nestjs/common';
import { BaseLoanPaymentManager } from './base-loan-payment-manager';
import { ILoan, ILoanPayment } from '@library/entity/entity-interface';
import { PaymentDomainService } from '@payment/domain/services';
import { LoanPaymentTypeCodes } from '@library/entity/enum';

/**
 * Handles loan refund payments
 */
@Injectable()
export class RefundPaymentManager extends BaseLoanPaymentManager {
  constructor(protected readonly paymentDomainService: PaymentDomainService) {
    super(paymentDomainService, LoanPaymentTypeCodes.Refund);
  }

  /**
   * Initiates a new refund payment for a loan
   * TODO: Refund requires more sophisticated logic and should be revisited
   * This is a placeholder implementation that may not cover all edge cases.
   * @param loanId The ID of the loan for which to initiate a refund payment
   * @returns The created loan payment or null if creation failed
   */
  public async initiate(loanId: string): Promise<ILoanPayment | null> {
    return this.initiatePayment(loanId);
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
}
