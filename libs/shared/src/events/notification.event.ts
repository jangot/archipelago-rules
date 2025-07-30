import { ZirtueEvent } from '@library/shared/modules/event';
import { INotificationUser } from '@notification/interfaces/inotification-user';
import { NotificationDataItems } from '@library/entity/enum/notification-data-items';


export class NotificationEventPayload {
  name: string;
  [NotificationDataItems.User]: INotificationUser;
  [NotificationDataItems.Loan]?: { amount: number };
}

export class NotificationEvent extends ZirtueEvent <NotificationEventPayload> {}
