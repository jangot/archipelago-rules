export const LoanTypeCodes = {
  Personal: 'personal',
  DirectBillPay: 'dbp',
  RepaymentRequest: 'repayment_request',
} as const;

export type LoanType = typeof LoanTypeCodes[keyof typeof LoanTypeCodes];
