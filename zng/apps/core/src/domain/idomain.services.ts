import { LoanDomainService } from './services/loan.domain.service';
import { PaymentDomainService } from './services/payment.domain.service';
import { UserDomainService } from './services/user.domain.service';

export abstract class IDomainServices {
  readonly userServices: UserDomainService;
  readonly loanServices: LoanDomainService;
  readonly paymentServices: PaymentDomainService;
}
