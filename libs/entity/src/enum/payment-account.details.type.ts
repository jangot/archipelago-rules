export const PaymentAccountDetailsTypeCodes = {
  Tabapay: 'tabapay',
  FiservDebit: 'fiserv_debit',
  FiservAch: 'fiserv_ach',
  CheckbookAchPlaidLink: 'checkbook_ach_plaid_link',
  CheckbookAch: 'checkbook_ach',
} as const;

export type PaymentAccountDetailsType = typeof PaymentAccountDetailsTypeCodes[keyof typeof PaymentAccountDetailsTypeCodes];
