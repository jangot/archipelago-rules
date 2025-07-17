import { ILoan, IPaymentsRouteStep } from '@library/entity/entity-interface';
import { LoanPaymentTypeCodes } from '@library/entity/enum';
import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '@payment/modules/domain/services';
import { BaseLoanPaymentManager, PaymentAccountPair } from './base-loan-payment-manager';

/**
 * FundingPaymentManager handles the first phase of loan funding where lenders
 * transfer loan capital to Zirtue's holding account. This implements the 
 * Lender → Zirtue payment flow and manages route step separation for multi-step
 * funding/disbursement processes.
 * 
 * Key responsibilities:
 * - Process lender-to-Zirtue fund transfers
 * - Calculate total funding amount (principal + fees)
 * - Handle first step of multi-step payment routes
 * - Coordinate with DisbursementPaymentManager for complete loan funding
 */
@Injectable()
export class FundingPaymentManager extends BaseLoanPaymentManager {

  constructor(protected readonly paymentDomainService: PaymentDomainService) {
    super(paymentDomainService, LoanPaymentTypeCodes.Funding);
  }

  /**
   * Resolves account pair for the Lender → Zirtue funding payment flow.
   * The source account is always the lender's account, while the target
   * should be Zirtue's holding account (currently using biller account
   * as temporary implementation).
   * 
   * @param loan - Loan entity containing account information
   * @returns Payment account pair with lender as source and Zirtue as target
   */
  protected getAccountPairForPaymentType(loan: ILoan): PaymentAccountPair {
    return { 
      fromAccountId: loan.lenderAccountId,
      toAccountId: loan.biller?.paymentAccountId || null,
    };
  }

  /**
   * Filters route steps to only include the funding phase for multi-step routes.
   * In combined Funding + Disbursement routes, funding handles only the first
   * step (Lender → Zirtue), while disbursement handles subsequent steps
   * (Zirtue → Biller). This separation allows independent processing and
   * tracking of each payment phase.
   * 
   * @param routeSteps - Complete array of route steps from payment route
   * @returns Array containing only the first step, or empty if single-step route
   */
  protected getStepsToApply(routeSteps: IPaymentsRouteStep[]): IPaymentsRouteStep[] {
    if (routeSteps.length > 1) {
      return [routeSteps[0]];
    }
    return [];
  }

  /**
   * Calculates the total funding amount including loan principal and all fees.
   * Lenders must provide the complete amount upfront, which includes processing
   * fees and service charges in addition to the loan principal that will be
   * disbursed to the biller.
   * 
   * @param loan - Loan entity containing amount and fee information
   * @returns Total funding amount (principal + fees)
   */
  protected getPaymentAmount(loan: ILoan): number {
    const { feeAmount, amount } = loan;
    return amount + (feeAmount || 0);
  }
}
