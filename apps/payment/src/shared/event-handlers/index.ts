import { LoanStateChangedEventHandler } from './loan-state-changed-event.handler';
import { TransferCompletedEventHandler } from './transfer-completed-event.handler';
import { TransferExecutedEventHandler } from './transfer-executed-event.handler';
import { TransferFailedEventHandler } from './transfer-failed-event.handler';

// Loan
export * from './loan-state-changed-event.handler';

// Transfer
export * from './transfer-completed-event.handler';
export * from './transfer-executed-event.handler';
export * from './transfer-failed-event.handler';


export const PAYMENT_EVENT_HANDLERS = [
  // Loan
  LoanStateChangedEventHandler,
  // Transfer
  TransferExecutedEventHandler,
  TransferCompletedEventHandler,
  TransferFailedEventHandler,
];
