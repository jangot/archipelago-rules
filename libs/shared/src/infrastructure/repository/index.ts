
import { LoanApplicationRepository } from '@core/modules/lending/repositories/loan-application.repository';
import { BillersRepository } from '@library/shared/modules/billers/billers.repository';
import { EventPublishedRepository } from './event-published.repository';
import { EventStoreRepository } from './event-store.repository';
import { EventSubscriberRepository } from './event-subscriber.repository';
import { LoanRepository } from './loan.repository';
import { PaymentAccountRepository } from './payment.account.repository';


export * from './event-published.repository';
export * from './event-store.repository';
export * from './event-subscriber.repository';
export * from './loan.repository';
export * from './payment.account.repository';

export const SharedRepositories = [
  PaymentAccountRepository,
  LoanRepository,
  LoanApplicationRepository,
  BillersRepository,
];

export const EventRepositories = [
  EventPublishedRepository,
  EventStoreRepository,
  EventSubscriberRepository,
];
