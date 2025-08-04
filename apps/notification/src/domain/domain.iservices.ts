import { NotificationDefinitionItemDomainService } from '@notification/domain/services/notification.definition.item.service';
import { NotificationDomainService } from '@notification/domain/services/notification.definition.service';
import { NotificationLogDomainService } from '@notification/domain/services/notification.log.service';
import { SharedNotificationDataViewDomainService } from '@library/shared/domain/service';

export abstract class IDomainServices {
  readonly notificationServices: NotificationDomainService;
  readonly notificationDefinitionItemServices: NotificationDefinitionItemDomainService;
  readonly notificationLogServices: NotificationLogDomainService;
  readonly notificationDataViewDomainService: SharedNotificationDataViewDomainService;
}
