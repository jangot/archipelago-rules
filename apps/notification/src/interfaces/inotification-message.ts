import { INotificationUser } from '@notification/interfaces/inotification-user';

export interface INotificationMessage {
  metadata: string;
  header: string;
  body: string;
  message: string;
  definitionItemId: string;
}

export interface INotificationMessageRequest extends INotificationMessage {
  user: INotificationUser;
  attributes: object;
}

export interface INotificationMessageResult extends INotificationMessage {
  userId: string;
  target: string;
  transport: string;
  status: string;
}
