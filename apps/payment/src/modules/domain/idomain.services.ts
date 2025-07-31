import { PaymentDomainService } from './services';
import { SharedNotificationDomainService } from '@library/shared/domain/service';

export abstract class IDomainServices {
  readonly paymentServices: PaymentDomainService;
  readonly notificationServices: SharedNotificationDomainService;
}
