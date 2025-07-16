export const LoanApplicationStatusCodes = {
  /** Loan application initial state */
  Created: 'created',
  /** Borrower has requested a loan */
  Submitted: 'submitted',
  /** Lender has offered a loan */
  Offered: 'offered',
  /** Loan application has been accepted */
  Accepted: 'accepted',
  /** Loan application has been sent to lender */
  Rejected: 'rejected',
} as const;

export type LoanApplicationStatus = typeof LoanApplicationStatusCodes[keyof typeof LoanApplicationStatusCodes]; 
