import { ZirtueEvent } from '@library/shared/modules/event';
import { INotificationUser } from '@notification/interfaces/inotification-user';


export class NotificationEventPayload {
  name: string;
  user: INotificationUser;
  loan?: { amount: number };
}

export class NotificationEvent extends ZirtueEvent <NotificationEventPayload> {}
