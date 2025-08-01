import { Injectable } from '@nestjs/common';
import { IDomainServices } from './idomain.services';
import { PaymentDomainService } from './services';

@Injectable()
export class DomainServices implements IDomainServices {
  constructor(
    public readonly paymentServices: PaymentDomainService,
  ) {}
}
