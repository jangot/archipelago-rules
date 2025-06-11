import { Injectable } from '@nestjs/common';
import { IDomainServices } from './idomain.services';
import { ManagementDomainService, PaymentDomainService } from './services';

@Injectable()
export class DomainServices implements IDomainServices {
  constructor(
    public readonly paymentServices: PaymentDomainService,
    public readonly management: ManagementDomainService
  ) {}
}
