import { ZirtueDistributedEvent } from '@library/shared/modules/event';
import { INotificationUser } from '@notification/interfaces/inotification-user';
import { NotificationDataItems } from '@library/entity/enum/notification-data-items';
import { LoanJson } from '@library/shared/domain/entity/notification-data.vew';

export class NotificationEventPayload {
  name: string;
  [NotificationDataItems.User]: INotificationUser;
  [NotificationDataItems.Code]?: string;
  [NotificationDataItems.LenderLoan]?: LoanJson;
  [NotificationDataItems.BorrowerLoan]?: LoanJson;
}

export class NotificationEvent extends ZirtueDistributedEvent<NotificationEventPayload> {}
