export const PAYMENT_ACCOUNT_RELATIONS = {
  User: 'user',
} as const;

export type PaymentAccountRelation = (typeof PAYMENT_ACCOUNT_RELATIONS)[keyof typeof PAYMENT_ACCOUNT_RELATIONS];
