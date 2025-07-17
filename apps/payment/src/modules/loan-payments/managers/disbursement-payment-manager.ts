import { ILoan, IPaymentsRouteStep } from '@library/entity/entity-interface';
import { LoanPaymentTypeCodes } from '@library/entity/enum';
import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '@payment/modules/domain/services';
import { BaseLoanPaymentManager, PaymentAccountPair } from './base-loan-payment-manager';

/**
 * DisbursementPaymentManager handles the final phase of loan funding where
 * Zirtue transfers loan principal from their holding account to the merchant
 * or biller's payment account. This implements the Zirtue → Biller payment
 * flow and completes the loan funding process.
 * 
 * Key responsibilities:
 * - Process Zirtue-to-biller fund transfers
 * - Handle remaining steps of multi-step payment routes
 * - Transfer only the loan principal (excluding fees retained by Zirtue)
 * - Complete the loan funding cycle after FundingPaymentManager
 */
@Injectable()
export class DisbursementPaymentManager extends BaseLoanPaymentManager {

  constructor(protected readonly paymentDomainService: PaymentDomainService) {
    super(paymentDomainService, LoanPaymentTypeCodes.Disbursement);
  }

  /**
   * Resolves account pair for the Zirtue → Biller disbursement payment flow.
   * The source should be Zirtue's holding account (currently using lender
   * account as temporary implementation) and target is the biller's payment
   * account where loan funds are ultimately delivered.
   * 
   * @param loan - Loan entity containing account information
   * @returns Payment account pair with Zirtue as source and biller as target
   */
  protected getAccountPairForPaymentType(loan: ILoan): PaymentAccountPair {
    return { 
      fromAccountId: loan.lenderAccountId,
      toAccountId: loan.biller?.paymentAccountId || null,
    };
  }
  
  /**
   * Filters route steps to exclude the funding phase for multi-step routes.
   * In combined Funding + Disbursement routes, disbursement handles all steps
   * after the first one (Zirtue → Biller and any intermediate steps), while
   * funding handles the initial step (Lender → Zirtue). For single-step routes,
   * disbursement processes all steps directly.
   * 
   * @param routeSteps - Complete array of route steps from payment route
   * @returns Array containing steps 2 through N, or all steps if single-step route
   */
  protected getStepsToApply(routeSteps: IPaymentsRouteStep[]): IPaymentsRouteStep[] {
    if (routeSteps.length > 1) {
      return routeSteps.slice(1);
    }
    return routeSteps;
  }
}
