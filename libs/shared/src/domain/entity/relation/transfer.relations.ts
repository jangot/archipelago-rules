export const TRANSFER_RELATIONS = {
  PaymentStep: 'loanPaymentStep',
  SourceAccount: 'sourceAccount',
  DestinationAccount: 'destinationAccount',
  Error: 'error',
  LoanPayment: 'loanPaymentStep.payment',
} as const;

/**
 * Type for transfer relation strings that can be passed to TypeORM
 */
export type TransferRelation = (typeof TRANSFER_RELATIONS)[keyof typeof TRANSFER_RELATIONS];
