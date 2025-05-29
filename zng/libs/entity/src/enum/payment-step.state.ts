export const PaymentStepStateCodes = {
  Created: 'created',
  Pending: 'pending',
  Completed: 'completed',
  Failed: 'failed',
} as const;

export type PaymentStepState = typeof PaymentStepStateCodes[keyof typeof PaymentStepStateCodes];
