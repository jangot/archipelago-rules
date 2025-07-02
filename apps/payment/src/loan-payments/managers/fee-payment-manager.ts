import { Injectable } from '@nestjs/common';
import { BaseLoanPaymentManager, PaymentOptions } from './base-loan-payment-manager';
import { ILoan, ILoanPayment } from '@library/entity/entity-interface';
import { PaymentDomainService } from '@payment/domain/services';
import { LoanPaymentStateCodes, LoanPaymentTypeCodes } from '@library/entity/enum';

/**
 * Handles loan fee payments
 */
@Injectable()
export class FeePaymentManager extends BaseLoanPaymentManager {
  constructor(protected readonly paymentDomainService: PaymentDomainService) {
    super(paymentDomainService, LoanPaymentTypeCodes.Fee);
  }

  /**
   * Initiates a new fee payment for a loan
   * @param loanId The ID of the loan for which to initiate a fee payment
   * @returns The created loan payment or null if creation failed
   */
  public async initiate(loanId: string): Promise<ILoanPayment | null> {
    return this.initiatePayment(loanId);
  }

  /**
   * Gets the source and target payment account IDs for fee payment
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
   * Gets the payment amount for fee payment type
   * @param loan The loan for which to get the payment amount
   * @returns The payment amount
   */
  protected getPaymentAmount(loan: ILoan): number {
    return loan.feeAmount || 0;
  }
  
  /**
   * Gets the payment options for fee payment
   * For zero amount, automatically mark as completed
   * @param _loan The loan for which to get payment options
   * @param amount The payment amount
   * @returns Object containing payment options
   */
  protected getPaymentOptions(_loan: ILoan, amount: number): PaymentOptions {
    // If amount is zero then create a completed payment without steps
    if (!amount) {
      const completionDate = new Date();
      return { 
        state: LoanPaymentStateCodes.Completed,
        completedAt: completionDate,
        scheduledAt: completionDate,
        initiatedAt: completionDate,
      };
    }
    return { state: LoanPaymentStateCodes.Created };
  }
}
