import { LoanDomainService } from './services/loan.domain.service';
import { UserDomainService } from './services/user.domain.service';
import { LoanApplicationDomainService } from './services/loan.application.domain.service';

export abstract class IDomainServices {
  readonly userServices: UserDomainService;
  readonly loanServices: LoanDomainService;
  readonly loanApplicationServices: LoanApplicationDomainService;
}
