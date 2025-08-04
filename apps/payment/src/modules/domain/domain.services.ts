import { Injectable } from '@nestjs/common';
import { IDomainServices } from './idomain.services';
import { PaymentDomainService } from './services';
import { SharedNotificationDomainService } from '@library/shared/domain/service';

@Injectable()
export class DomainServices implements IDomainServices {
  constructor(
    public readonly paymentServices: PaymentDomainService,
    public readonly notificationServices: SharedNotificationDomainService,
  ) {}
}
