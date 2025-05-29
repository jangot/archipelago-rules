export const PaymentAccountTypeCodes = {
  DebitCard: 'debit_card',
  BankAccount: 'bank_account',
  BillerNetwork: 'biller_network',
} as const;

export type PaymentAccountType = typeof PaymentAccountTypeCodes[keyof typeof PaymentAccountTypeCodes];
