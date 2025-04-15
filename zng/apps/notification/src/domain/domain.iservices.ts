import { NotificationDomainService } from './services/notification.definition.service';

export abstract class IDomainServices {
  readonly notificationServices: NotificationDomainService;
}
