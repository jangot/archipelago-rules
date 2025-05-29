/**
 * Defines all available loan payment relations
 * Use this constant to ensure type safety when specifying relations to load with loan entities
 */
export const LOAN_PAYMENT_RELATIONS = {
  Loan: 'loan',
  Steps: 'steps',
  StepsTransfers: 'steps.transfers',
  StepsTransfersErrors: 'steps.transfers.error',
  StepsSourcePaymentAccount: 'steps.sourcePaymentAccount',
  StepsTargetPaymentAccount: 'steps.targetPaymentAccount',

} as const;
  
/**
   * Type for loan relation strings that can be passed to TypeORM
   */
export type LoanPaymentRelation = (typeof LOAN_PAYMENT_RELATIONS)[keyof typeof LOAN_PAYMENT_RELATIONS];
