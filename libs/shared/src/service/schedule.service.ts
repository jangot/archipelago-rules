import { LoanFeeModeCodes, LoanPaymentFrequency, LoanPaymentFrequencyCodes } from '@library/entity/enum';
import { round2 } from '@library/shared/common/helper';
import { PlanPreviewInput, PlanPreviewOutputItem, RepaymentPlanPaidPayment } from '@library/shared/type/lending';
import { Logger } from '@nestjs/common';
import { addMonths, addWeeks } from 'date-fns';

export class ScheduleService {
  private readonly logger: Logger = new Logger(ScheduleService.name);
  
  public static previewRepaymentPlan(input: PlanPreviewInput): PlanPreviewOutputItem[] {
    const payments: PlanPreviewOutputItem[] = [];
    const { amount, paymentsCount, paymentFrequency, feeMode, feeAmount, repaymentStartDate } = input;
    // Fast-quit for invalid input
    if (amount <= 0 || paymentsCount <= 0 || (feeAmount !== null && feeAmount < 0)) return payments;
    // Cuurentrly support only 'Standard' fee type
    if (feeAmount && feeAmount > 0 && feeMode && feeMode !== LoanFeeModeCodes.Standard) return payments;

    // TODO: Move control over that higher?
    const firstPaymentDate = repaymentStartDate || addMonths(new Date(), 1);


    let totalBalance = amount + (feeAmount || 0);
    // For 'Standard' fee mode we spread its amount to repayment process
    let paymentAmount = round2(totalBalance / paymentsCount); 
    for (let i = 0; i < paymentsCount; i++) {
      const paymentDate = this.getRepaymentDate(firstPaymentDate, paymentFrequency, i);

      const beginningBalance = totalBalance;
      totalBalance = round2(totalBalance - paymentAmount);

      // Last payment might be different than others beacuse of rounding tail
      // Ex: 1000 / 3 = 333.33, 333.33, 333.34
      if (i === paymentsCount - 1) {
        paymentAmount = round2(totalBalance + paymentAmount);
        totalBalance = 0;
      }

      payments.push({
        amount: paymentAmount,
        index: i,
        paymentsLeft: paymentsCount - i - 1,
        paymentDate,
        beginningBalance,
        endingBalance: totalBalance,
      });
    }
    
    return payments;
  }

  /**
   * Calculates and returns a preview of remaining repayments for a loan plan after accounting for payments already made.
   * 
   * This method takes the current loan state and a list of paid repayments, then generates a new repayment plan
   * for the remaining balance. It combines the original loan amount and fee amount, subtracts any paid amounts,
   * and creates a fresh repayment schedule starting from the next payment date.
   * 
   * @param currentLoanState - The current state of the loan containing amount, payment count, frequency, fee details, and start date.
   *                          The amount and feeAmount should remain unchanged from the original loan to ensure correct calculations.
   *                          The paymentsCount and paymentFrequency should reflect the new plan for remaining repayments.
   * @param paidRepayments - Array of repayment payments that have already been made, containing amount and payment date information
   * 
   * @returns Array of remaining repayment plan items showing the schedule for unpaid repayments
   * 
   * @remarks
   * - The method assumes 'Standard' fee mode. Logic may need adjustment for other fee modes.
   * - Since previous repayment plan changes are unknown, the method combines fee and loan amounts into remainingBalance,
   *   sets feeAmount to 0, and calculates a new plan from that combined amount.
   * - The next payment date is determined by either the original repayment start date (if no payments made) or
   *   one payment period after the last paid repayment date.
   */
  public static previewRemainingRepayments(currentLoanState: PlanPreviewInput, paidRepayments: RepaymentPlanPaidPayment[]): PlanPreviewOutputItem[] {
    // TODO: !!! Logic changes if feeMode is not 'Standard'

    const { amount, paymentsCount, paymentFrequency, feeMode, feeAmount, repaymentStartDate } = currentLoanState;
    const originalBalance = amount + (feeAmount || 0);
    const anyPaidAlready = paidRepayments && paidRepayments.length;

    // Sum the paid repayments to get the total paid amount
    const paidBalance = anyPaidAlready ? paidRepayments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
    const remainingBalance = originalBalance - paidBalance;

    // Get the date when next payment should happen
    let nextPaymentDate = repaymentStartDate;
    if (anyPaidAlready) {
      // If there are paid repayments, set the next payment date to the last paid repayment date
      const lastPaid = paidRepayments.reduce((max, payment) => 
        payment.index > max.index ? payment : max
      );
      nextPaymentDate = this.getRepaymentDate(lastPaid.paymentDate, paymentFrequency, 1);
    }

    // Build the remaining repayments plan as a new plan by using calculated data
    return this.previewRepaymentPlan({
      amount: remainingBalance,
      paymentsCount: paymentsCount,
      paymentFrequency,
      feeMode,
      feeAmount: 0,
      repaymentStartDate: nextPaymentDate,
    });
  }

  /**
   * Calculate the repayment date based on the first payment date and payment frequency.
   * @param firstPaymentDate Date of the first payment
   * @param paymentFrequency Type of payment frequency (e.g., monthly, weekly)
   * @param paymentIndex Index of the payment
   * @returns Date of the repayment
   */
  private static getRepaymentDate(firstPaymentDate: Date, paymentFrequency: LoanPaymentFrequency, paymentIndex: number): Date {
    if (paymentIndex < 0) {
      // TODO: Make Domain exception
      throw new Error('Payment index cannot be negative');
    }
    if (paymentIndex === 0) return firstPaymentDate;
    switch (paymentFrequency) {
      case LoanPaymentFrequencyCodes.Monthly:
        return addMonths(firstPaymentDate, paymentIndex);
      case LoanPaymentFrequencyCodes.Weekly:
        return addWeeks(firstPaymentDate, paymentIndex);
      case LoanPaymentFrequencyCodes.Semimonthly:
        return addWeeks(firstPaymentDate, paymentIndex * 2);
      default:
        // TODO: Make Domain exception
        throw new Error(`Unsupported payment frequency: ${paymentFrequency}`);
    }
  }
}
