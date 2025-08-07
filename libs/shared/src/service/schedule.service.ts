import { LoanFeeModeCodes, LoanPaymentFrequency, LoanPaymentFrequencyCodes } from '@library/entity/enum';
import { round2 } from '@library/shared/common/helper';
import { PlanPreviewInput, PlanPreviewOutputItem, RepaymentPlanPaidPayment } from '@library/shared/type/lending';
import { Logger } from '@nestjs/common';
import { addMonths, addWeeks } from 'date-fns';

export class ScheduleService {

  private readonly logger: Logger = new Logger(ScheduleService.name);
  
  // TODO: Later might be dynamic based on further stages requirements
  public static SERVICE_FEE_PERCENTAGE: number = 5;

  public static previewRepaymentPlan(input: PlanPreviewInput): PlanPreviewOutputItem[] {
    const payments: PlanPreviewOutputItem[] = [];
    const { amount, paymentsCount, paymentFrequency, feeMode, feeAmount, repaymentStartDate } = input;
    // Fast-quit for invalid input
    if (amount <= 0 || paymentsCount <= 0 || (feeAmount !== null && feeAmount < 0)) return payments;
    // Cuurentrly support only 'Standard' fee type
    if (feeAmount && feeAmount > 0 && feeMode && feeMode !== LoanFeeModeCodes.Standard) return payments;

    const firstPaymentDate = repaymentStartDate || addMonths(new Date(), 1);

    // Calculate separate amounts per payment for principal and fees
    const totalPrincipalBalance = amount;
    const totalFeeBalance = feeAmount || 0;
    
    // For 'Standard' fee mode we spread principal and fee amounts separately to repayment process
    let principalBalance = totalPrincipalBalance;
    let feeBalance = totalFeeBalance;
    let principalAmount = round2(totalPrincipalBalance / paymentsCount);
    let feeAmountPerPayment = round2(totalFeeBalance / paymentsCount);
    
    for (let i = 0; i < paymentsCount; i++) {
      const paymentDate = this.getRepaymentDate(firstPaymentDate, paymentFrequency, i);

      const beginningBalance = principalBalance + feeBalance;
      principalBalance = round2(principalBalance - principalAmount);
      feeBalance = round2(feeBalance - feeAmountPerPayment);

      // Last payment might be different than others because of rounding tail
      // Ex: 1000 / 3 = 333.33, 333.33, 333.34
      if (i === paymentsCount - 1) {
        principalAmount = round2(principalBalance + principalAmount);
        feeAmountPerPayment = round2(feeBalance + feeAmountPerPayment);
        principalBalance = 0;
        feeBalance = 0;
      }

      payments.push({
        amount: principalAmount,
        feeAmount: feeAmountPerPayment,
        index: i,
        paymentsLeft: paymentsCount - i - 1,
        paymentDate,
        beginningBalance,
        endingBalance: principalBalance + feeBalance,
      });
    }
    
    return payments;
  }

  public static previewFeeAmount(principalAmount: number): number {
    if (principalAmount <= 0) {
      return 0;
    }
    // Calculate the service fee based on the principal amount
    const feeAmount = round2(principalAmount * (this.SERVICE_FEE_PERCENTAGE / 100));
    return feeAmount;
  }

  public static previewApplicationPlan(input: PlanPreviewInput): PlanPreviewOutputItem[] {
    const { amount } = input;
    const feeAmount = this.previewFeeAmount(amount);
    return this.previewRepaymentPlan({ ...input, feeAmount });
  }

  /**
   * Calculates and returns a preview of remaining repayments for a loan plan after accounting for payments already made.
   * 
   * This method takes the current loan state and a list of paid repayments, then generates a new repayment plan
   * for the remaining balance. It separately tracks principal and fee amounts, subtracts paid amounts from each,
   * and creates a fresh repayment schedule starting from the next payment date.
   * 
   * @param currentLoanState - The current state of the loan containing amount, payment count, frequency, fee details, and start date.
   *                          The amount and feeAmount should remain unchanged from the original loan to ensure correct calculations.
   *                          The paymentsCount and paymentFrequency should reflect the new plan for remaining repayments.
   * @param paidRepayments - Array of repayment payments that have already been made, containing amount, feeAmount and payment date information
   * 
   * @returns Array of remaining repayment plan items showing the schedule for unpaid repayments
   * 
   * @remarks
   * - The method assumes 'Standard' fee mode. Logic may need adjustment for other fee modes.
   * - Principal and fee amounts are tracked separately throughout the calculation process.
   * - The next payment date is determined by either the original repayment start date (if no payments made) or
   *   one payment period after the last paid repayment date.
   */
  public static previewRemainingRepayments(currentLoanState: PlanPreviewInput, paidRepayments: RepaymentPlanPaidPayment[]): PlanPreviewOutputItem[] {
    // TODO: !!! Logic changes if feeMode is not 'Standard'

    const { amount, paymentsCount, paymentFrequency, feeMode, feeAmount, repaymentStartDate } = currentLoanState;
    const originalPrincipalBalance = amount;
    const originalFeeBalance = feeAmount || 0;
    const anyPaidAlready = paidRepayments && paidRepayments.length;

    // Sum the paid repayments to get the total paid amounts (principal and fees separately)
    const paidPrincipalBalance = anyPaidAlready ? paidRepayments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
    const paidFeeBalance = anyPaidAlready ? paidRepayments.reduce((sum, payment) => sum + payment.feeAmount, 0) : 0;
    const remainingPrincipalBalance = originalPrincipalBalance - paidPrincipalBalance;
    const remainingFeeBalance = originalFeeBalance - paidFeeBalance;

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
      amount: remainingPrincipalBalance,
      paymentsCount: paymentsCount,
      paymentFrequency,
      feeMode,
      feeAmount: remainingFeeBalance,
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
