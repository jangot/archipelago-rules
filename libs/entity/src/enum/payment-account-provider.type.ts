export const PaymentAccountProviderCodes = {
  Fiserv: 'fiserv',
  Checkbook: 'checkbook',
  Tabapay: 'tabapay',
} as const;

export type PaymentAccountProvider = typeof PaymentAccountProviderCodes[keyof typeof PaymentAccountProviderCodes];
