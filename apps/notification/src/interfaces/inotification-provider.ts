import {
  INotificationMessageRequest,
  INotificationMessageResult,
} from '@notification/interfaces/inotification-message';

export interface INotificationProvider {
  sendMessage(message: INotificationMessageRequest): Promise<INotificationMessageResult>;
}
