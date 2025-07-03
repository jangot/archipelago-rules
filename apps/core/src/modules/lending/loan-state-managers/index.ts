// Loan State Managers Export Index
export { AcceptedLoanStateManager } from './accepted-loan-state-manager';
export { FundingLoanStateManager } from './funding-loan-state-manager';
export { FundingPausedLoanStateManager } from './funding-paused-loan-state-manager';
export { FundedLoanStateManager } from './funded-loan-state-manager';
export { DisbursingLoanStateManager } from './disbursing-loan-state-manager';
export { DisbursingPausedLoanStateManager } from './disbursing-paused-loan-state-manager';
export { DisbursedLoanStateManager } from './disbursed-loan-state-manager';
export { RepayingLoanStateManager } from './repaying-loan-state-manager';
export { RepaymentPausedLoanStateManager } from './repayment-paused-loan-state-manager';
export { RepaidLoanStateManager } from './repaid-loan-state-manager';
export { ClosedLoanStateManager } from './closed-loan-state-manager';

// Re-export the base class for convenience
export { BaseLoanStateManager } from './base-loan-state-manager';

// Container class
export { LoanStateManagers } from './loan-state-managers';

// Array of all state manager classes for module providers
import { AcceptedLoanStateManager } from './accepted-loan-state-manager';
import { FundingLoanStateManager } from './funding-loan-state-manager';
import { FundingPausedLoanStateManager } from './funding-paused-loan-state-manager';
import { FundedLoanStateManager } from './funded-loan-state-manager';
import { DisbursingLoanStateManager } from './disbursing-loan-state-manager';
import { DisbursingPausedLoanStateManager } from './disbursing-paused-loan-state-manager';
import { DisbursedLoanStateManager } from './disbursed-loan-state-manager';
import { RepayingLoanStateManager } from './repaying-loan-state-manager';
import { RepaymentPausedLoanStateManager } from './repayment-paused-loan-state-manager';
import { RepaidLoanStateManager } from './repaid-loan-state-manager';
import { ClosedLoanStateManager } from './closed-loan-state-manager';

export const LOAN_STATE_MANAGERS = [
  AcceptedLoanStateManager,
  FundingLoanStateManager,
  FundingPausedLoanStateManager,
  FundedLoanStateManager,
  DisbursingLoanStateManager,
  DisbursingPausedLoanStateManager,
  DisbursedLoanStateManager,
  RepayingLoanStateManager,
  RepaymentPausedLoanStateManager,
  RepaidLoanStateManager,
  ClosedLoanStateManager,
] as const;
