export const LoanApplicationStates = {
  Pending: 'pending',
  Submitted: 'submitted',
  Approved: 'approved',
  Rejected: 'rejected',
  Deactivated: 'deactivated',
  Cancelled: 'cancelled',
  Completed: 'completed',
} as const;
export type LoanApplicationStateType = typeof LoanApplicationStates[keyof typeof LoanApplicationStates];
