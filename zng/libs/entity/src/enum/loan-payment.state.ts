export const LoanPaymentStateCodes = {
  Pending: 'pending',
  Completed: 'completed',
  Failed: 'failed',
} as const;

export type LoanPaymentState = typeof LoanPaymentStateCodes[keyof typeof LoanPaymentStateCodes];
