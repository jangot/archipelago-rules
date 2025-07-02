export const LoanAssignIntentCodes = {
  Propose: 'propose',
  Registration: 'registration',
} as const;

export type LoanAssignIntent = typeof LoanAssignIntentCodes[keyof typeof LoanAssignIntentCodes];
