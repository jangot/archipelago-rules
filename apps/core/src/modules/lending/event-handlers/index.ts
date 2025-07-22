import { PaymentCompletedEventHandler } from './payment-completed-event.handler';
import { PaymentFailedEventHandler } from './payment-failed-event.handler';

export * from './payment-completed-event.handler';

export const LENDING_EVENT_HANDLERS = [
  // Payment Events
  PaymentCompletedEventHandler,
  PaymentFailedEventHandler,
];
