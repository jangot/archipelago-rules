import { ILoan, ILoanPayment, ILoanPaymentStep } from '@library/entity/entity-interface';
import { LoanPaymentTypeCodes } from '@library/entity/enum';
import { Loan } from '@library/shared/domain/entity';
import { LOAN_PAYMENT_RELATIONS, LOAN_RELATIONS } from '@library/shared/domain/entity/relation';
import { ScheduleService } from '@library/shared/service';
import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '@payment/modules/domain/services';
import { DeepPartial } from 'typeorm';
import { BaseLoanPaymentManager } from './base-loan-payment-manager';

/**
 * Handles loan repayment payments
 */
@Injectable()
export class RepaymentPaymentManager extends BaseLoanPaymentManager {
  constructor(protected readonly paymentDomainService: PaymentDomainService) {
    super(paymentDomainService, LoanPaymentTypeCodes.Repayment);
  }

  /**
   * Initiates a new repayment payment for a loan
   * RepaymentPaymentManager is special as it creates multiple payments at once
   * @param loanId The ID of the loan for which to initiate a repayment payment
   * @returns The created loan payments or null if creation failed
   */
  public async initiate(loanId: string): Promise<ILoanPayment[] | null> {
    this.logger.debug(`Initiating repayment payment for loan ${loanId}`);
    
    // Get loan with necessary relations
    const loan = await this.getLoan(loanId, [LOAN_RELATIONS.Payments, LOAN_RELATIONS.Biller, LOAN_RELATIONS.BillerPaymentAccount]);
    
    // Check for duplicate payment
    if (this.hasDuplicatePayment(loan.payments)) {
      this.logger.error(`${this.paymentType} payment already exists for loan ${loanId}`);
      return null;
    }
    
    // Get payment accounts
    const { fromAccountId, toAccountId } = await this.getPaymentAccounts(loan);
    if (!fromAccountId || !toAccountId) {
      return null;
    }
    
    // Get the route with its steps
    const route = await this.findRouteForPayment(fromAccountId, toAccountId, loan.type);
    
    // Calculate repayment schedule
    const { amount, paymentsCount, paymentFrequency, feeMode, feeAmount, createdAt } = loan;
    const repaymentPlan = ScheduleService.previewRepaymentPlan({
      amount,
      paymentsCount,
      paymentFrequency,
      feeMode,
      feeAmount,
      repaymentStartDate: createdAt,
    });

    // Create payments from the repayment plan
    const repayments = await this.paymentDomainService.saveRepaymentPlan(repaymentPlan, loanId);

    if (!repayments || !repayments.length) {
      this.logger.error(`Failed to create repayment payments for loan ${loanId}`);
      return null;
    }

    // Generate steps for each payment
    const generatedSteps: DeepPartial<ILoanPaymentStep>[] = [];
    repayments.forEach(repayment => {
      const repaymentSteps = this.generateStepsForPayment(repayment, route, fromAccountId, toAccountId);
      if (repaymentSteps && repaymentSteps.length) {
        generatedSteps.push(...repaymentSteps);
      } else {
        this.logger.error('Failed to generate repayment payment steps for loan', { repayment, route, fromAccountId, toAccountId });
      }
    });

    // Save steps and return payments with their steps
    await this.paymentDomainService.createPaymentSteps(generatedSteps);
    return this.paymentDomainService.getPaymentsByIds(
      repayments.map(r => r.id), 
      [LOAN_PAYMENT_RELATIONS.Steps]
    );
  }

  /**
   * Gets the source and target payment account IDs for repayment payment
   * For repayments, the borrower pays to the lender (reverse direction from other payments)
   * @param loan The loan for which to get payment accounts
   * @returns Object containing fromAccountId and toAccountId
   */
  protected async getPaymentAccounts(loan: ILoan): Promise<{ fromAccountId: string | null; toAccountId: string | null }> {
    const { lenderAccountId, borrowerAccountId } = loan;
    
    if (!lenderAccountId) {
      this.logger.warn(`Lender account ID is missing for loan ${loan.id}`);
      return { fromAccountId: null, toAccountId: null };
    }

    if (!borrowerAccountId) {
      this.logger.warn(`Borrower account ID is missing for loan ${loan.id}`);
      return { fromAccountId: null, toAccountId: null };
    }

    return { 
      fromAccountId: borrowerAccountId, // Note: For repayment, borrower is the source
      toAccountId: lenderAccountId,      // And lender is the recipient
    };
  }

  /**
   * Gets information about the next scheduled repayment
   * @param loan The loan to check for next repayment
   * @returns The next scheduled repayment or null if none exists
   */
  public async getNextScheduledRepayment(loan: Loan): Promise<ILoanPayment | null> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _loan = loan; // Prevent unused parameter warning while implementation is pending
    return null; // Implementation needed
  }
}
