export const LoanApplicationValidationRejectTypes = {
  View: 'You are not authorized to view this loan application',
  Accept: 'You are not authorized to accept this loan application',
  Update: 'You are not authorized to update this loan application',
  Reject: 'You are not authorized to reject this loan application',
  Cancel: 'You are not authorized to cancel this loan application',
  Submit: 'You are not authorized to submit this loan application',
} as const;

export type LoanApplicationValidationRejectType = typeof LoanApplicationValidationRejectTypes[keyof typeof LoanApplicationValidationRejectTypes];
