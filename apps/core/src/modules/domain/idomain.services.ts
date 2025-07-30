import { LoanDomainService } from './services/loan.domain.service';
import { NotificationDomainService } from './services/notification.domain.service';
import { UserDomainService } from './services/user.domain.service';

export abstract class IDomainServices {
  readonly userServices: UserDomainService;
  readonly loanServices: LoanDomainService;
  readonly notificationServices: NotificationDomainService;
}
