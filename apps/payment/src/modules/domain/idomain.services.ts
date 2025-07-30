import { NotificationDomainService, PaymentDomainService } from './services';

export abstract class IDomainServices {
  readonly paymentServices: PaymentDomainService;
  readonly notificationServices: NotificationDomainService;
}
