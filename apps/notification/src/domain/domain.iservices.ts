import { NotificationDefinitionItemDomainService } from './services/notification.definition.item.service';
import { NotificationDomainService } from './services/notification.definition.service';

export abstract class IDomainServices {
  readonly notificationServices: NotificationDomainService;
  readonly notificationDefinitionItemServices: NotificationDefinitionItemDomainService;
}
