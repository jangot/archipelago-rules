export const PaymentAccountStateCodes = {
  Created: 'created',
  Verifying: 'verifying',
  Verified: 'verified',
  Suspected: 'suspected',
  Inactive: 'inactive',
  // TODO: Add invalid / expired e.g. Plaid token
} as const;

export type PaymentAccountState = typeof PaymentAccountStateCodes[keyof typeof PaymentAccountStateCodes];
