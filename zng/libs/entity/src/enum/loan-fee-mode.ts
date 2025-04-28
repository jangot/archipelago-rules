export const LoanFeeModeCodes = {
  Standard: 'standard',
} as const;

export type LoanFeeMode = typeof LoanFeeModeCodes[keyof typeof LoanFeeModeCodes];
