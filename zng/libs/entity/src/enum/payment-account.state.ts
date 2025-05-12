export const PaymentAccountStateCodes = {
  Created: 'created',
  Verifying: 'verifying',
  Verified: 'verified',
  Suspected: 'suspected',
  Inactive: 'inactive',
} as const;

export type PaymentAccountState = typeof PaymentAccountStateCodes[keyof typeof PaymentAccountStateCodes];
