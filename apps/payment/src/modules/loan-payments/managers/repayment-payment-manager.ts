import { LoanPaymentTypeCodes } from '@library/entity/enum';
import { Loan, LoanPayment } from '@library/shared/domain/entity';
import { LOAN_PAYMENT_RELATIONS, LOAN_RELATIONS } from '@library/shared/domain/entity/relation';
import { ScheduleService } from '@library/shared/service';
import { PlanPreviewInput, PlanPreviewOutputItem, RepaymentPlanPaidPayment } from '@library/shared/type/lending';
import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '@payment/modules/domain/services';
import { BaseLoanPaymentManager } from './base-loan-payment-manager';

/**
 * Handles loan repayment payments
 */
@Injectable()
export class RepaymentPaymentManager extends BaseLoanPaymentManager {
  constructor(protected readonly paymentDomainService: PaymentDomainService) {
    super(paymentDomainService, LoanPaymentTypeCodes.Repayment);
  }

  public async initiate(loanId: string): Promise<LoanPayment | null> {
    this.logger.debug(`Initiating repayment payment for loan ${loanId}`);
    
    // Get loan with necessary relations
    const loan = await this.getLoan(loanId, [LOAN_RELATIONS.Payments, LOAN_RELATIONS.Biller, LOAN_RELATIONS.BillerPaymentAccount]);
    const { payments, type } = loan;

    // Get payment accounts
    const { fromAccountId, toAccountId } = await this.getPaymentAccounts(loan);
    if (!fromAccountId || !toAccountId) return null;
    
    // Get the route with its steps
    const route = await this.findRouteForPayment(fromAccountId, toAccountId, type);

    const samePaymentsInitiated = this.getSamePayments(payments, ['created', 'pending']);
    if (samePaymentsInitiated && samePaymentsInitiated.length > 0) {
      this.logger.error(`Repayment payment already initiated for loan ${loanId}`);
      return null;
    }

    const samePaymentsCompleted = this.getSamePayments(payments, ['completed']);
    const anyPaymentsCompleted = samePaymentsCompleted && samePaymentsCompleted.length;
    const paymentNumber = anyPaymentsCompleted ? samePaymentsCompleted.length + 1 : 1;
    // Payments count overflow must be checked before the new payment initiation call
    // Buit to keep consistency we check it here as well
    if (paymentNumber > loan.paymentsCount) {
      this.logger.error(`Payment number ${paymentNumber} exceeds total payments count for loan ${loanId}`);
      return null;
    }

    // Get the next payment from the remaining repayments plan
    const nextPayment = this.getNextPayment(loan, samePaymentsCompleted);
    if (!nextPayment) return null;

    // Save the new repayment payment
    const savedPayment = await this.paymentDomainService.createRepaymentByPreview({ ...nextPayment, index: paymentNumber }, loanId);
    if (!savedPayment) {
      this.logger.error(`Failed to create repayment payment for loan ${loanId}`, { nextPayment, paymentNumber });
      return null;
    }

    // Generate steps for the new payment
    const generatedSteps = this.generateStepsForPayment(savedPayment, route, fromAccountId, toAccountId);
    if (!generatedSteps || !generatedSteps.length) {
      this.logger.error('Failed to generate repayment payment steps for loan', { savedPayment, route, fromAccountId, toAccountId });
      return null;
    }
    // Save the generated steps
    await this.paymentDomainService.createPaymentSteps(generatedSteps);
    // Return the saved payment with its steps
    return this.paymentDomainService.getLoanPaymentById(savedPayment.id, [LOAN_PAYMENT_RELATIONS.Steps]);
  }

  /**
   * Gets the source and target payment account IDs for repayment payment
   * For repayments, the borrower pays to the lender (reverse direction from other payments)
   * @param loan The loan for which to get payment accounts
   * @returns Object containing fromAccountId and toAccountId
   */
  protected async getPaymentAccounts(loan: Loan): Promise<{ fromAccountId: string | null; toAccountId: string | null }> {
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
   * Gets the next payment for the loan based on the current state and paid payments
   * @param loan The loan for which to get the next payment
   * @param paidPayments The list of payments that have already been made
   * @returns The next payment to be made, or null if it cannot be determined
   */
  private getNextPayment(loan: Loan, paidPayments: LoanPayment[]): PlanPreviewOutputItem | null {
    const { id: loanId, amount, paymentsCount, paymentFrequency, feeMode, feeAmount, createdAt } = loan;
    
    // Build the current state for repayment plan preview
    const currentState: PlanPreviewInput = {
      amount,
      paymentsCount,
      paymentFrequency,
      feeMode,
      feeAmount,
      repaymentStartDate: createdAt,
    };

    // Map paid payments to the format required for remaining repayments calculation
    const paidRepayments: RepaymentPlanPaidPayment[] = paidPayments.map(p => ({
      amount: p.amount,
      paymentDate: p.scheduledAt || p.createdAt,
      index: p.paymentNumber || 1,
    }));

    // Calculate remaining repayments
    const remainingRepayments = ScheduleService.previewRemainingRepayments(currentState, paidRepayments);
    if (!remainingRepayments || !remainingRepayments.length) {
      this.logger.error(`Unable to calculate remaining repayments plan for loan ${loanId}`, { currentState, paidRepayments });
      return null;
    }

    // Return the next payment from the remaining repayments
    return remainingRepayments.reduce((lowest, current) => 
      current.index < lowest.index ? current : lowest
    );
  }


}
