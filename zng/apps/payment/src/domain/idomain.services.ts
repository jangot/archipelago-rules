import { PaymentDomainService } from './services/payment.domain.service';

export abstract class IDomainServices {
  readonly paymentServices: PaymentDomainService;
}
