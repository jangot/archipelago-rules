import { IDomainServices } from '@core/domain/idomain.services';
import { LoanFeeModeCodes, LoanPaymentFrequency, LoanPaymentFrequencyCodes } from '@library/entity/enum';
import { round2 } from '@library/shared/common/helpers';
import { PlanPreviewInput, PlanPreviewOutputItem } from '@library/shared/types/lending';
import { Logger } from '@nestjs/common';
import { addMonths, addWeeks } from 'date-fns';

export class ScheduleService {
  private readonly logger: Logger = new Logger(ScheduleService.name);
  
  constructor(private readonly domainServices: IDomainServices) {}

  public async previewRepaymentPlan(input: PlanPreviewInput): Promise<PlanPreviewOutputItem[]> {
    const payments: PlanPreviewOutputItem[] = [];
    const { amount, paymentsCount, paymentFrequency, feeMode, feeValue, repaymentStartDate } = input;
    // Fast-quit for invalid input
    if (amount <= 0 || paymentsCount <= 0 || (feeValue !== null && feeValue < 0)) return payments;
    // Cuurentrly support only 'Standart' fee type
    if (feeValue && feeValue > 0 && feeMode && feeMode !== LoanFeeModeCodes.Standart) return payments;

    // TODO: Move control over that higher?
    const firstPaymentDate = repaymentStartDate || addMonths(new Date(), 1);


    let totalBalance = amount + (feeValue || 0);
    // For 'Standart' fee mode we spread its amount to repayment process
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
   * Calculate the repayment date based on the first payment date and payment frequency.
   * @param firstPaymentDate Date of the first payment
   * @param paymentFrequency Type of payment frequency (e.g., monthly, weekly)
   * @param paymentIndex Index of the payment
   * @returns Date of the repayment
   */
  private getRepaymentDate(firstPaymentDate: Date, paymentFrequency: LoanPaymentFrequency, paymentIndex: number): Date {
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
