import { LoanFeeModeCodes, LoanPaymentFrequencyCodes } from '@library/entity/enum';
import { ScheduleService } from '@library/shared/service/schedule.service';
import { addMonths, addWeeks } from 'date-fns';

describe('ScheduleService - previewRepaymentPlan', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let service: ScheduleService;

  beforeEach(() => {
    service = new ScheduleService(); // Mock domainServices as it's not used in this method
  });

  it('should return an empty array for invalid input', async () => {
    const invalidInputs = [
      { 
        amount: -100, 
        paymentsCount: 5, 
        paymentFrequency: LoanPaymentFrequencyCodes.Monthly, 
        feeMode: null, 
        feeAmount: null, 
        repaymentStartDate: null, 
      },
      { amount: 100, 
        paymentsCount: 0, 
        paymentFrequency: LoanPaymentFrequencyCodes.Monthly, 
        feeMode: null, 
        feeAmount: null, 
        repaymentStartDate: null, 
      },
      { 
        amount: 100, 
        paymentsCount: 5, 
        paymentFrequency: LoanPaymentFrequencyCodes.Monthly, 
        feeMode: LoanFeeModeCodes.Standard, 
        feeAmount: -10, 
        repaymentStartDate: null, 
      },
    ];

    for (const input of invalidInputs) {
      const result = ScheduleService.previewRepaymentPlan(input);
      expect(result).toEqual([]);
    }
  });

  it('should calculate repayment plan with default repayment start date', async () => {
    const input = {
      amount: 1000,
      paymentsCount: 3,
      paymentFrequency: LoanPaymentFrequencyCodes.Monthly,
      feeMode: LoanFeeModeCodes.Standard,
      feeAmount: 30,
      repaymentStartDate: null,
    };

    const result = ScheduleService.previewRepaymentPlan(input);

    expect(result).toHaveLength(3);
    expect(result[0].amount).toBeCloseTo(343.33, 2);
    expect(result[1].amount).toBeCloseTo(343.33, 2);
    expect(result[2].amount).toBeCloseTo(343.34, 2);
    expect(result[2].endingBalance).toBe(0);
  });

  it('should calculate repayment plan with a custom repayment start date', async () => {
    const repaymentStartDate = new Date('2023-12-01');
    const input = {
      amount: 1200,
      paymentsCount: 4,
      paymentFrequency: LoanPaymentFrequencyCodes.Monthly,
      feeMode: LoanFeeModeCodes.Standard,
      feeAmount: 0,
      repaymentStartDate,
    };

    const result = ScheduleService.previewRepaymentPlan(input);

    expect(result).toHaveLength(4);
    expect(result[0].paymentDate).toEqual(repaymentStartDate);
    expect(result[1].paymentDate).toEqual(addMonths(repaymentStartDate, 1));
    expect(result[2].paymentDate).toEqual(addMonths(repaymentStartDate, 2));
    expect(result[3].paymentDate).toEqual(addMonths(repaymentStartDate, 3));
    expect(result[3].endingBalance).toBe(0);
  });

  it('should calculate repayment plan with weekly frequency', async () => {
    const repaymentStartDate = new Date('2023-12-01');
    const input = {
      amount: 500,
      paymentsCount: 5,
      paymentFrequency: LoanPaymentFrequencyCodes.Weekly,
      feeMode: LoanFeeModeCodes.Standard,
      feeAmount: 0,
      repaymentStartDate,
    };

    const result = ScheduleService.previewRepaymentPlan(input);

    expect(result).toHaveLength(5);
    expect(result[0].paymentDate).toEqual(repaymentStartDate);
    expect(result[1].paymentDate).toEqual(addWeeks(repaymentStartDate, 1));
    expect(result[2].paymentDate).toEqual(addWeeks(repaymentStartDate, 2));
    expect(result[4].paymentDate).toEqual(addWeeks(repaymentStartDate, 4));
    expect(result[4].endingBalance).toBe(0);
  });

  it('should calculate repayment plan with semimonthly frequency', async () => {
    const repaymentStartDate = new Date('2023-12-01');
    const input = {
      amount: 600,
      paymentsCount: 3,
      paymentFrequency: LoanPaymentFrequencyCodes.Semimonthly,
      feeMode: LoanFeeModeCodes.Standard,
      feeAmount: 0,
      repaymentStartDate,
    };

    const result = ScheduleService.previewRepaymentPlan(input);

    expect(result).toHaveLength(3);
    expect(result[0].paymentDate).toEqual(repaymentStartDate);
    expect(result[1].paymentDate).toEqual(addWeeks(repaymentStartDate, 2));
    expect(result[2].paymentDate).toEqual(addWeeks(repaymentStartDate, 4));
    expect(result[2].endingBalance).toBe(0);
  });

  it('should handle rounding differences in the last payment', async () => {
    const input = {
      amount: 1000,
      paymentsCount: 3,
      paymentFrequency: LoanPaymentFrequencyCodes.Monthly,
      feeMode: LoanFeeModeCodes.Standard,
      feeAmount: 0,
      repaymentStartDate: null,
    };

    const result = ScheduleService.previewRepaymentPlan(input);

    expect(result).toHaveLength(3);
    expect(result[0].amount).toBeCloseTo(333.33, 2);
    expect(result[1].amount).toBeCloseTo(333.33, 2);
    expect(result[2].amount).toBeCloseTo(333.34, 2);
    expect(result[2].endingBalance).toBe(0);
  });
});
