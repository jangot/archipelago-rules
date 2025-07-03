export const LoanInviteeTypeCodes = {
  Borrower: 'borrower',
  Lender: 'lender',
} as const;

export type LoanInviteeType = typeof LoanInviteeTypeCodes[keyof typeof LoanInviteeTypeCodes];
