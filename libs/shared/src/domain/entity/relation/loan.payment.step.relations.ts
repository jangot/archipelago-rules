/**
 * Defines all available loan payment relations
 * Use this constant to ensure type safety when specifying relations to load with loan entities
 */
export const LOAN_PAYMENT_STEP_RELATIONS = {
  Payment: 'payment',
  PaymentSteps: 'payment.steps',
  Transfers: 'transfers',
  TransfersErrors: 'transfers.error',
  SourcePaymentAccount: 'sourcePaymentAccount',
  TargetPaymentAccount: 'targetPaymentAccount',
  
} as const;
    
/**
     * Type for loan relation strings that can be passed to TypeORM
     */
export type LoanPaymentStepRelation = (typeof LOAN_PAYMENT_STEP_RELATIONS)[keyof typeof LOAN_PAYMENT_STEP_RELATIONS];
  
