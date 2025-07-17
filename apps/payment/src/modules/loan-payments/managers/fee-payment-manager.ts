import { ILoan } from '@library/entity/entity-interface';
import { LoanPaymentTypeCodes } from '@library/entity/enum';
import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '@payment/modules/domain/services';
import { BaseLoanPaymentManager, PaymentAccountPair } from './base-loan-payment-manager';

/**
 * Handles loan fee payments
 */
@Injectable()
export class FeePaymentManager extends BaseLoanPaymentManager {
  constructor(protected readonly paymentDomainService: PaymentDomainService) {
    super(paymentDomainService, LoanPaymentTypeCodes.Fee);
  }

  // TODO: Use explicit Payment Account for Fee
  protected getAccountPairForPaymentType(loan: ILoan): PaymentAccountPair {
    return { 
      fromAccountId: loan.lenderAccountId,
      toAccountId: loan.biller?.paymentAccountId || null,
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
}
