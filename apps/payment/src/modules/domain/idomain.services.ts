import { PaymentDomainService } from './services';
import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class IDomainServices {
  readonly paymentServices: PaymentDomainService;
}
