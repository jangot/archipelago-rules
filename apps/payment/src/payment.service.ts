import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentService {
  getHello(): string {
    return 'Hello World!';
  }

  // TODO: onLoanStateStepped
  // - check if payment is required. If true - initiate payment
  // - NOT the same as `onLoanStateChanged` to avoid events storm.
  // - `onLoanStateStepped` fires by `core` and ONLY if state change requires new payment initiation
  // - ? `immediateExecution` flag to start payments for funding, disbursement, etc. immediately. Should be false for Repayment

  // TODO: onLoanPauseResumeRequested
  // - quite the same as `onLoanStateStepped` but for paused loans
  // - fires when in `core` we have a call to try resume paused Loan
  // - creates a chain payment->steps->transfer which execution will delegate the Loan state change back to `core` after initiation
}
