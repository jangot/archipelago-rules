
import { LoanApplicationRepository } from '@core/modules/lending/repositories/loan-application.repository';
import { ILoanApplicationRepository } from '@core/shared/interfaces/repositories/iloan-application.repository';
import { IEventPublishedRepository, IEventStoreRepository, IEventSubscriberRepository, ILoanRepository, IPaymentAccountRepository } from '../interface';
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
  { provide: IPaymentAccountRepository, useClass: PaymentAccountRepository },
  { provide: ILoanRepository, useClass: LoanRepository },
  { provide: ILoanApplicationRepository, useClass: LoanApplicationRepository },
];

export const EventRepositories = [
  { provide: IEventPublishedRepository, useClass: EventPublishedRepository },
  { provide: IEventStoreRepository, useClass: EventStoreRepository },
  { provide: IEventSubscriberRepository, useClass: EventSubscriberRepository },
];
