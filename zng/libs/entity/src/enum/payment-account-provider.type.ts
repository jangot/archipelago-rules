export const PaymentAccountProviderCodes = {
  Fiserv: 'fiserv',
  Checkbook: 'checkbook',
} as const;

export type PaymentAccountProvider = typeof PaymentAccountProviderCodes[keyof typeof PaymentAccountProviderCodes];
