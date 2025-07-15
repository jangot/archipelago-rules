export const LoanApplicationStatusCodes = {
  /** Loan application initial state */
  Created: 'created',
  /** Borrower has requested a loan */
  Requested: 'requested',
  /** Lender has offered a loan */
  Offered: 'offered',
  /** Loan application has been accepted */
  Accepted: 'accepted',
  /** Loan application has been sent to lender */
  SentToLender: 'sent_to_lender',
} as const;

export type LoanApplicationStatus = typeof LoanApplicationStatusCodes[keyof typeof LoanApplicationStatusCodes]; 
