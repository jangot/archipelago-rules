import { Injectable } from '@nestjs/common';
import { BaseLoanPaymentManager } from './base-loan-payment-manager';
import { ILoanPayment } from '@library/entity/interface';
import { LOAN_RELATIONS } from '@library/shared/domain/entities/relations';
import { LoanPaymentTypeCodes } from '@library/entity/enum';
import { IDomainServices } from '@payment/domain/idomain.services';

/**
 * Handles loan disbursement payments
 */
@Injectable()
export class DisbursementPaymentManager extends BaseLoanPaymentManager {
  constructor(protected readonly domainServices: IDomainServices) {
    super(domainServices);
  }

  /**
   * Initiates a new disbursement payment for a loan
   * @param loanId The ID of the loan for which to initiate a disbursement payment
   * @returns The created loan payment or null if creation failed
   */
  public async initiate(loanId: string): Promise<ILoanPayment | null> {
    this.logger.debug(`Initiating disbursement payment for loan ${loanId}`);
    // 1. Check the existance of the payment -> duplicates throws error
    const loan = await this.getLoan(loanId, [LOAN_RELATIONS.Payments, LOAN_RELATIONS.Biller, LOAN_RELATIONS.BillerPaymentAccount]);
    const { payments, lenderAccountId, biller, type } = loan;

    if (!lenderAccountId) {
      this.logger.warn(`Lender account ID is missing for loan ${loanId}`);
      return null; // Cannot proceed without a lender account
    }

    if (!biller || !biller.paymentAccountId) {
      this.logger.warn(`Biller or Biller's payment Account is missing for loan ${loanId}`);
      return null; // Cannot proceed without a biller
    }

    // Check if a disbursement payment already exists
    // On disbursement we are okay if no payments yet (case: no fee + no funding due to same payment provider transfer)
    const disbursementPayment = payments && payments.find(payment => payment.type === LoanPaymentTypeCodes.Disbursement);
    if (disbursementPayment) {
      this.logger.warn(`Disbursement payment already exists for loan ${loanId}`);
      return null;
    }

    // 2. Get the Route with it steps
    const route = await this.domainServices.paymentServices.findRouteForPayment(
      lenderAccountId, 
      biller.paymentAccountId, 
      LoanPaymentTypeCodes.Disbursement, 
      type
    );

    if (!route) {
      this.logger.error(`Cant route ${LoanPaymentTypeCodes.Disbursement} payment for Loan ${loanId}`);
      return null; // Cannot proceed without a valid payment route
    }
    // 3. Create Payment and Steps -> save & return
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _loanId = loanId; // Prevent unused parameter warning while implementation is pending
    return null; // Implementation needed
  }
}
