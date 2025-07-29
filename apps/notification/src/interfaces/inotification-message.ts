import { INotificationUser } from '@notification/interfaces/inotification-user';

export interface INotificationMessage {
  metadata: string;
  header: string;
  body: string;
  message: string;
}

export interface INotificationMessageRequest extends INotificationMessage {
  user: INotificationUser;
  attributes: object;
}

export interface INotificationMessageResult extends INotificationMessage {
  target: string;
  userId: string;
  transport: string;
  status: string;
}
