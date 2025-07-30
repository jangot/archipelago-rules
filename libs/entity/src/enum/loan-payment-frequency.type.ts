export const LoanPaymentFrequencyCodes = {
  /** Default repayment frequency. Each new payment will be calculated as `current + 1 month` */
  Monthly: 'monthly',
  /** Each new payment will be calculated as `current + 2 weeks` */
  Semimonthly: 'semimonthly',
  /** Each new payment will be calculated as `current + 1 week` */
  Weekly: 'weekly',
  /** one time payment can be any date that has a minimum duration of `current + 30 days`*/ //TODO: needs review
  OneTime: 'one_time',
} as const;

export type LoanPaymentFrequency = typeof LoanPaymentFrequencyCodes[keyof typeof LoanPaymentFrequencyCodes];
