import { AcceptedLoanStateManager, ClosedLoanStateManager, DisbursedLoanStateManager, DisbursingLoanStateManager, DisbursingPausedLoanStateManager, FundedLoanStateManager, FundingLoanStateManager, FundingPausedLoanStateManager, RepaidLoanStateManager, RepayingLoanStateManager, RepaymentPausedLoanStateManager } from '../loan-state-managers';

export abstract class ILoanStateManagers {
  readonly accepted: AcceptedLoanStateManager;
  readonly funding: FundingLoanStateManager;
  readonly fundingPaused: FundingPausedLoanStateManager;
  readonly funded: FundedLoanStateManager;
  readonly disbursing: DisbursingLoanStateManager;
  readonly disbursingPaused: DisbursingPausedLoanStateManager;
  readonly disbursed: DisbursedLoanStateManager;
  readonly repaying: RepayingLoanStateManager;
  readonly repaymentPaused: RepaymentPausedLoanStateManager;
  readonly repaid: RepaidLoanStateManager;
  readonly closed: ClosedLoanStateManager;
}
