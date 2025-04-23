import { LoanFeeMode, LoanPaymentFrequency } from '@library/entity/enum';

export interface PlanPreviewInput {
  amount: number;
  paymentsCount: number;
  paymentFrequency: LoanPaymentFrequency;
  feeMode: LoanFeeMode | null;
  feeValue: number | null;
  repaymentStartDate: Date | null;
}
