/**
 * Defines all available loan relations
 * Use this constant to ensure type safety when specifying relations to load with loan entities
 */
export const LOAN_RELATIONS = {
  Lender: 'lender',
  Borrower: 'borrower',
  Invitee: 'invitee',
  Biller: 'biller',
  BillerPaymentAccount: 'biller.paymentAccount',
  Payments: 'payments',
  PaymentsSteps: 'payments.steps',
  PaymentStepsSourceAccount: 'payments.steps.sourcePaymentAccount',
  PaymentStepsTargetAccount: 'payments.steps.targetPaymentAccount',
  Transfers: 'payments.steps.transfers',
  TransfersErrors: 'payments.steps.transfers.error',
  LenderPaymentAccount: 'lenderAccount',
  BorrowerPaymentAccount: 'borrowerAccount',
  CurrentError: 'currentError',
} as const;

/**
 * Type for loan relation strings that can be passed to TypeORM
 */
export type LoanRelation = (typeof LOAN_RELATIONS)[keyof typeof LOAN_RELATIONS];
