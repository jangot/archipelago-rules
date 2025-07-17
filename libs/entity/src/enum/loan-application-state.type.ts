export const LoanApplicationStates = {
  Pending: 'pending',
  Submitted: 'submitted',
  Approved: 'approved',
  Rejected: 'rejected',
} as const;
export type LoanApplicationStateType = typeof LoanApplicationStates[keyof typeof LoanApplicationStates];
