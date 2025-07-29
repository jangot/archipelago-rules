import { NotificationDefinitionItemDomainService } from '@notification/domain/services/notification.definition.item.service';
import { NotificationDomainService } from '@notification/domain/services/notification.definition.service';

export abstract class IDomainServices {
  readonly notificationServices: NotificationDomainService;
  readonly notificationDefinitionItemServices: NotificationDefinitionItemDomainService;
}
