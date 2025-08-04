import { PaymentDomainService } from './services';
import { Injectable } from '@nestjs/common';
import { SharedNotificationDomainService } from '@library/shared/domain/service';

@Injectable()
export abstract class IDomainServices {
  readonly paymentServices: PaymentDomainService;
  readonly notificationServices: SharedNotificationDomainService;
}
