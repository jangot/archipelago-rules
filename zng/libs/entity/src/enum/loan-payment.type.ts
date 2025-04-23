export const LoanPaymentTypeCodes = {
  Funding: 'funding',
  Disbursement: 'disbursement',
  Fee: 'fee',
  Repayment: 'repayment',
  Refund: 'refund',
} as const;

export type LoanPaymentType = typeof LoanPaymentTypeCodes[keyof typeof LoanPaymentTypeCodes];
