import { DisbursementPaymentStrategy } from './disbursement-payment.strategy';
import { FundingPaymentStrategy } from './funding-payment.strategy';
import { RepaymentStrategy } from './repayment.strategy';

export * from './disbursement-payment.strategy';
export * from './funding-payment.strategy';
export * from './repayment.strategy';

export const LOAN_STATE_STRATEGIES = [FundingPaymentStrategy, DisbursementPaymentStrategy, RepaymentStrategy] as const;

