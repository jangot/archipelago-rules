import { LoanPaymentTypeCodes } from '@library/entity/enum';
import { Loan } from '@library/shared/domain/entity';
import { Injectable } from '@nestjs/common';
import { IDomainServices } from '@payment/modules/domain';
import { BaseLoanPaymentManager, PaymentAccountPair } from './base-loan-payment-manager';

/**
 * RefundPaymentManager handles loan refund payments where funds are returned
 * to borrowers or billers due to loan cancellations, overpayments, or fee
 * reversals. This implements flexible refund flows that can originate from
 * lenders and target various recipients based on refund scenarios.
 * 
 * Key responsibilities:
 * - Process refund transfers for loan cancellations and overpayments
 * - Handle fee reversals and partial refund scenarios
 * - Support multiple refund recipients (borrowers, billers, etc.)
 * - Calculate appropriate refund amounts based on loan history
 * - Integrate with payment history for accurate refund calculations
 */
@Injectable()
export class RefundPaymentManager extends BaseLoanPaymentManager {

  constructor(protected readonly domainServices: IDomainServices) {
    super(domainServices, LoanPaymentTypeCodes.Refund);
  }

  /**
   * Resolves account pair for refund payment flows. Currently implements
   * Lender → Biller refund flow as the primary scenario, but refund logic
   * should be enhanced to support multiple recipient types based on the
   * specific refund scenario (loan cancellation, overpayment, fee reversal).
   * 
   * @param loan - Loan entity containing account information
   * @returns Payment account pair with lender as source and biller as target
   */
  protected getAccountPairForPaymentType(loan: Loan): PaymentAccountPair {
    return { 
      fromAccountId: loan.lenderAccountId,
      toAccountId: loan.biller?.paymentAccountId || null,
    };
  }

  /**
   * Calculates refund amount using loan principal as base amount. This is
   * a simplified implementation that needs enhancement to handle complex
   * refund scenarios including partial refunds based on payment history,
   * fee reversals, interest adjustments, and time-based refund calculations.
   * 
   * @param loan - Loan entity containing amount information
   * @returns The refund amount to be processed, defaults to 0 if not specified
   * @todo Requires more sophisticated logic for refund amount calculation
   *       including partial refunds, fee reversals, interest adjustments,
   *       and payment history analysis for accurate refund determination
   */
  protected getPaymentAmount(loan: Loan): number {
    return loan.amount || 0;
  }
}
