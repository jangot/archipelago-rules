import { PaymentDomainService } from './services';

export abstract class IDomainServices {
  readonly paymentServices: PaymentDomainService;
}
