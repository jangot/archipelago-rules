import { INotificationProvider } from '@notification/interfaces/inotification-provider';
import {
  INotificationMessageRequest,
  INotificationMessageResult
} from '@notification/interfaces/inotification-message';

export class BaseNotificationProvider implements INotificationProvider {

  async sendMessage(message: INotificationMessageRequest): Promise<INotificationMessageResult> {
    throw new Error('No implemented');
  }

  protected buildResult(message: INotificationMessageRequest, target: string, status: string, transport: string): INotificationMessageResult {
    return {
      transport,
      status,
      target,
      userId: message.user.id,
      metadata: message.metadata,
      header: message.header,
      body: message.body,
      message: message.message,
    };
  }
}
