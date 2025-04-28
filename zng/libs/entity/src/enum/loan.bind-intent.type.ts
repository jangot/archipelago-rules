export const LoanBindIntentCodes = {
  Propose: 'propose',
  Registration: 'registration',
} as const;

export type LoanBindIntent = typeof LoanBindIntentCodes[keyof typeof LoanBindIntentCodes];
