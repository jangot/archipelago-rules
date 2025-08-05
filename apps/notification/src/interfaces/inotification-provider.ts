import {
  INotificationMessageRequest,
  INotificationMessageResult,
} from '@notification/interfaces/inotification-message';

export interface INotificationProvider {
  send(message: INotificationMessageRequest): Promise<INotificationMessageResult>;
}
