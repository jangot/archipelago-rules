export const LoanFeeModeCodes = {
  Standart: 'standart',
} as const;

export type LoanFeeMode = typeof LoanFeeModeCodes[keyof typeof LoanFeeModeCodes];
