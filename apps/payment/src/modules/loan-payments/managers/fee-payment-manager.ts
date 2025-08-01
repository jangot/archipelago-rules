import { LoanPaymentTypeCodes } from '@library/entity/enum';
import { Loan } from '@library/shared/domain/entity';
import { Injectable } from '@nestjs/common';
import { IDomainServices } from '@payment/modules/domain';
import { BaseLoanPaymentManager, PaymentAccountPair } from './base-loan-payment-manager';

/**
 * FeePaymentManager handles loan fee payments where lenders pay processing
 * fees and service charges to Zirtue for loan origination and management
 * services.
 * 
 * Key responsibilities:
 * - Process lender-to-Zirtue fee transfers
 * - Handle processing fees, service charges, and other loan-related costs
 * - Use loan's feeAmount field for payment calculation
 */
@Injectable()
export class FeePaymentManager extends BaseLoanPaymentManager {

  constructor(protected readonly domainServices: IDomainServices) {
    super(domainServices, LoanPaymentTypeCodes.Fee);
  }

  /**
   * Resolves account pair for the Lender → Zirtue fee payment flow.
   * The source account is the lender's account, while the target should
   * be Zirtue's fee collection account (currently using biller account
   * as temporary implementation pending dedicated fee account setup).
   * 
   * @param loan - Loan entity containing lender account information
   * @returns Payment account pair with lender as source and Zirtue as target
   * @todo Use explicit Payment Account for Fee instead of biller account
   */
  protected getAccountPairForPaymentType(loan: Loan): PaymentAccountPair {
    return { 
      fromAccountId: loan.lenderAccountId,
      toAccountId: loan.biller?.paymentAccountId || null,
    };
  }
  
  /**
   * Calculates the fee payment amount using the loan's configured fee amount.
   * Fee payments use only the feeAmount field from the loan entity, which
   * represents processing fees, service charges, or other costs associated
   * with loan origination and management. This amount is separate from the
   * loan principal handled by funding payments.
   * 
   * @param loan - Loan entity containing fee amount configuration
   * @returns The fee amount to be paid, defaults to 0 if no fees configured
   */
  protected getPaymentAmount(loan: Loan): number {
    return loan.feeAmount || 0;
  }
}
