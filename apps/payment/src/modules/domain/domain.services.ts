import { Injectable } from '@nestjs/common';
import { IDomainServices } from './idomain.services';
import { NotificationDomainService, PaymentDomainService } from './services';

@Injectable()
export class DomainServices implements IDomainServices {
  constructor(
    public readonly paymentServices: PaymentDomainService,
    public readonly notificationServices: NotificationDomainService,
  ) {}
}
