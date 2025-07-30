import { LoanStateSteppedEventHandler } from './loan-state-stepped-event.handler';
import { PaymentCompletedEventHandler } from './payment-completed-event.handler';
import { PaymentFailedEventHandler } from './payment-failed-event.handler';

export * from './loan-state-stepped-event.handler';
export * from './payment-completed-event.handler';
export * from './payment-failed-event.handler';

export const LENDING_EVENT_HANDLERS = [
  // Payment Events
  PaymentCompletedEventHandler,
  PaymentFailedEventHandler,
  // Loan Events
  LoanStateSteppedEventHandler,
];
