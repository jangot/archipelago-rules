import { BillersDomainService } from '@library/shared/domain/service/billers.domain.service';
import { LoanDomainService } from './services/loan.domain.service';
import { UserDomainService } from './services/user.domain.service';

export abstract class IDomainServices {
  readonly userServices: UserDomainService;
  readonly loanServices: LoanDomainService;
  readonly billersServices: BillersDomainService;
}
