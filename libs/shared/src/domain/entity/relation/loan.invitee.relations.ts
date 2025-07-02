export const LOAN_INVITEE_RELATIONS = {
  Loan: 'loan',
} as const;

export type LoanInviteeRelation = (typeof LOAN_INVITEE_RELATIONS)[keyof typeof LOAN_INVITEE_RELATIONS];
