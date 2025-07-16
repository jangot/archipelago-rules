import { AcceptedLoanStrategy } from './accepted-loan.strategy';
import { ClosedLoanStrategy } from './closed-loan.strategy';
import { DisbursementPaymentStrategy } from './disbursement-payment.strategy';
import { FundingPaymentStrategy } from './funding-payment.strategy';
import { RepaymentStrategy } from './repayment.strategy';

export * from './accepted-loan.strategy';
export * from './closed-loan.strategy';
export * from './disbursement-payment.strategy';
export * from './funding-payment.strategy';
export * from './repayment.strategy';

export const LOAN_STATE_STRATEGIES = [
  AcceptedLoanStrategy,
  ClosedLoanStrategy,
  DisbursementPaymentStrategy,
  FundingPaymentStrategy,
  RepaymentStrategy,
] as const;

