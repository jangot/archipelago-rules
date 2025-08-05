import { LoanPaymentStateCodes, LoanPaymentTypeCodes } from '@library/entity/enum';
import { Loan, LoanPayment } from '@library/shared/domain/entity';
import { ScheduleService } from '@library/shared/service';
import { PlanPreviewInput, PlanPreviewOutputItem, RepaymentPlanPaidPayment } from '@library/shared/type/lending';
import { Injectable } from '@nestjs/common';
import { IDomainServices } from '@payment/modules/domain';
import { BaseLoanPaymentManager, PaymentAccountPair } from './base-loan-payment-manager';

/**
 * RepaymentPaymentManager handles scheduled loan repayment payments where
 * borrowers make installment payments directly to lenders according to the
 * established repayment schedule. This implements the Borrower → Lender
 * payment flow and manages complex repayment scheduling logic.
 * 
 * Key responsibilities:
 * - Process borrower-to-lender repayment transfers
 * - Calculate next payment amounts using repayment schedule
 * - Allow multiple repayment initiations until loan is fully paid
 * - Track payment numbers and validate against total payment count
 * - Integrate with ScheduleService for accurate payment calculations
 */
@Injectable()
export class RepaymentPaymentManager extends BaseLoanPaymentManager {

  constructor(protected readonly domainServices: IDomainServices) {
    super(domainServices, LoanPaymentTypeCodes.Repayment);
  }

  /**
   * Resolves account pair for the Borrower → Lender repayment payment flow.
   * Repayments flow directly from the borrower's account to the lender's
   * account, bypassing Zirtue's holding accounts since this is a direct
   * peer-to-peer repayment transaction.
   * 
   * @param loan - Loan entity containing borrower and lender account information
   * @returns Payment account pair with borrower as source and lender as target
   */
  protected getAccountPairForPaymentType(loan: Loan): PaymentAccountPair {
    return { 
      fromAccountId: loan.borrowerAccountId,
      toAccountId: loan.lenderAccountId,
    };
  }

  /**
   * Determines if another repayment can be initiated after previous completions.
   * Unlike single-payment types (funding, disbursement), repayments allow
   * multiple initiations until all scheduled payments are completed. This
   * method validates against the loan's total payment count to prevent
   * over-payment and ensures payment number sequencing.
   * 
   * @param loan - Loan entity with payment count configuration
   * @param completedPayments - Array of already completed repayment payments
   * @returns True if more payments can be initiated, false if loan is fully paid
   */
  protected canInitiateAfterCompleted(loan: Loan, completedPayments: LoanPayment[]): boolean {
    const { id: loanId, paymentsCount } = loan;
    const highestPaymentNumber = Math.max(...completedPayments.map(p => p.paymentNumber || 0));
    if (highestPaymentNumber >= paymentsCount) { 
      this.logger.error(`Loan ${loanId} already has all payments completed or initiated`);
      return false;
    }
    return true;
  }

  /**
   * Calculates the next repayment payment using the loan's repayment schedule.
   * This method integrates with ScheduleService to determine accurate payment
   * amounts and dates based on payment history. It handles payment number
   * sequencing and schedules the next installment according to the loan's
   * payment frequency and remaining balance.
   * 
   * @param loan - Loan entity with repayment configuration and payment history
   * @returns Partial payment object with calculated amount and schedule, or null if calculation fails
   */
  protected calculateNewPayment(loan: Loan): Partial<LoanPayment> | null {
    const { id: loanId, payments } = loan;

    const samePaymentsCompleted = this.getSameCompletedPayments(payments);
    const anyPaymentsCompleted = samePaymentsCompleted && samePaymentsCompleted.length;
    const paymentNumber = anyPaymentsCompleted ? samePaymentsCompleted.length + 1 : 1;

    const nextPayment = this.getNextPayment(loan, samePaymentsCompleted);
    if (!nextPayment) {
      this.logger.error(`Unable to calculate next payment for loan ${loanId}`, { loan });
      return null;
    }

    const failedAttempts = this.getSameFailedPayments(payments);
    const installmentAttempts = failedAttempts && failedAttempts.length ? failedAttempts.filter(a => a.paymentNumber === paymentNumber).length : 0;

    return {
      amount: nextPayment.amount,
      loanId,
      attempt: installmentAttempts,
      paymentNumber,
      type: this.paymentType,
      state: LoanPaymentStateCodes.Created,
      scheduledAt: nextPayment.paymentDate,
    };
  }

  /**
   * Calculates the next scheduled payment using the loan's repayment plan and
   * payment history. This method builds the current loan state, maps completed
   * payments to the required format, and uses ScheduleService to calculate
   * remaining repayments. It returns the earliest remaining payment based on
   * payment index to ensure proper payment sequencing.
   * 
   * @param loan - Loan entity with repayment configuration
   * @param paidPayments - Array of completed repayment payments for history
   * @returns Next scheduled payment with amount and date, or null if calculation fails
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
      feeAmount: p.feeAmount || 0,
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
