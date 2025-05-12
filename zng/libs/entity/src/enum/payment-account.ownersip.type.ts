export const PaymentAccountOwnershipTypeCodes = {
  Personal: 'personal',
  Internal: 'internal',
  External: 'external',
} as const;

export type PaymentAccountOwnershipType = typeof PaymentAccountOwnershipTypeCodes[keyof typeof PaymentAccountOwnershipTypeCodes];
