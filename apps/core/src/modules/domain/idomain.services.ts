import { BillersDomainService } from '@library/shared/domain/service/billers.domain.service';
import { LoanDomainService, NotificationDomainService, UserDomainService } from '@core/modules/domain/services';

export abstract class IDomainServices {
  readonly userServices: UserDomainService;
  readonly loanServices: LoanDomainService;
  readonly billersServices: BillersDomainService;
  readonly notificationServices: NotificationDomainService;
}
