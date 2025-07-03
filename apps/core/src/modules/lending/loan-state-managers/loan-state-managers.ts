import { Injectable } from '@nestjs/common';
import { ILoanStateManagers } from '../interfaces';
import { AcceptedLoanStateManager } from './accepted-loan-state-manager';
import { ClosedLoanStateManager } from './closed-loan-state-manager';
import { DisbursedLoanStateManager } from './disbursed-loan-state-manager';
import { DisbursingLoanStateManager } from './disbursing-loan-state-manager';
import { DisbursingPausedLoanStateManager } from './disbursing-paused-loan-state-manager';
import { FundedLoanStateManager } from './funded-loan-state-manager';
import { FundingLoanStateManager } from './funding-loan-state-manager';
import { FundingPausedLoanStateManager } from './funding-paused-loan-state-manager';
import { RepaidLoanStateManager } from './repaid-loan-state-manager';
import { RepayingLoanStateManager } from './repaying-loan-state-manager';
import { RepaymentPausedLoanStateManager } from './repayment-paused-loan-state-manager';

@Injectable()
export class LoanStateManagers implements ILoanStateManagers {
  // eslint-disable-next-line max-params
  constructor(
    public readonly accepted: AcceptedLoanStateManager,
    public readonly funding: FundingLoanStateManager,
    public readonly fundingPaused: FundingPausedLoanStateManager,
    public readonly funded: FundedLoanStateManager,
    public readonly disbursing: DisbursingLoanStateManager,
    public readonly disbursingPaused: DisbursingPausedLoanStateManager,
    public readonly disbursed: DisbursedLoanStateManager,
    public readonly repaying: RepayingLoanStateManager,
    public readonly repaymentPaused: RepaymentPausedLoanStateManager,
    public readonly repaid: RepaidLoanStateManager,
    public readonly closed: ClosedLoanStateManager,
  ) {}
}
