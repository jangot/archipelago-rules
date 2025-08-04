import {
  BillersDomainService,
  SharedNotificationDomainService,
  SharedNotificationDataViewDomainService,
} from '@library/shared/domain/service';
import { LoanDomainService, UserDomainService } from '@core/modules/domain/services';

export abstract class IDomainServices {
  readonly userServices: UserDomainService;
  readonly loanServices: LoanDomainService;
  readonly billersServices: BillersDomainService;
  readonly notificationServices: SharedNotificationDomainService;
  readonly notificationDataServices: SharedNotificationDataViewDomainService;
}
