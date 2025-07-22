import { LoanStateChangedEventHandler } from './loan-state-changed-event.handler';
import { PaymentStepCompletedEventHandler } from './payment-step-completed-event.handler';
import { PaymentStepFailedEventHandler } from './payment-step-failed-event.handler';
import { PaymentStepPendingEventHandler } from './payment-step-pending-event.handler';
import { PaymentSteppedEventHandler } from './payment-stepped-event.handler';
import { TransferCompletedEventHandler } from './transfer-completed-event.handler';
import { TransferExecutedEventHandler } from './transfer-executed-event.handler';
import { TransferFailedEventHandler } from './transfer-failed-event.handler';

// Loan
export * from './loan-state-changed-event.handler';

// Transfer
export * from './transfer-completed-event.handler';
export * from './transfer-executed-event.handler';
export * from './transfer-failed-event.handler';
// Payment Step
export * from './payment-step-completed-event.handler';
export * from './payment-step-failed-event.handler';
export * from './payment-step-pending-event.handler';
// Payment
export * from './payment-stepped-event.handler';


export const PAYMENT_EVENT_HANDLERS = [
  // Loan
  LoanStateChangedEventHandler,
  // Transfer
  TransferExecutedEventHandler,
  TransferCompletedEventHandler,
  TransferFailedEventHandler,
  // Payment Step
  PaymentStepPendingEventHandler,
  PaymentStepCompletedEventHandler,
  PaymentStepFailedEventHandler,
  // Payment
  PaymentSteppedEventHandler,
];
