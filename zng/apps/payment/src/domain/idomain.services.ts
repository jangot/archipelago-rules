import { ManagementDomainService, PaymentDomainService } from './services';

export abstract class IDomainServices {
  readonly paymentServices: PaymentDomainService;
  readonly management: ManagementDomainService;
}
