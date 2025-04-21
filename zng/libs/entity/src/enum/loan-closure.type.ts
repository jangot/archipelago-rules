export const LonaClosureCodes = {
  /** Entire Loan was repaid */
  PaidOut: 'paid_out',
  /** Loan closed by creator before Accepted */
  Cancelled: 'cancelled',
  /** Lender declined offer from Borrower */
  Declined: 'declined',
  /** Lender forgive unpaid part of the Loan (including entire Loan) */
  Forgiven: 'forgiven',
  /** Loan was deactivated by Administrator */
  Deactivated: 'deactivated',
} as const;

export type LoanClosure = typeof LonaClosureCodes[keyof typeof LonaClosureCodes];
