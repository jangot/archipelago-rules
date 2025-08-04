import { BillersDomainService, SharedNotificationDomainService } from '@library/shared/domain/service';
import { LoanDomainService, UserDomainService } from '@core/modules/domain/services';
import { NotificationDefinitionRepository } from '@library/shared/infrastructure/repository';

export abstract class IDomainServices {
  readonly userServices: UserDomainService;
  readonly loanServices: LoanDomainService;
  readonly billersServices: BillersDomainService;
  readonly notificationServices: SharedNotificationDomainService;
}
