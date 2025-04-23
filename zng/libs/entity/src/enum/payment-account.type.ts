export const PaymentAccountTypeCodes = {
  DebitCard: 'debit_card',
  BankAccount: 'bank_account',
} as const;

export type PaymentAccountType = typeof PaymentAccountTypeCodes[keyof typeof PaymentAccountTypeCodes];
