import { INotificationProvider } from '@notification/interfaces/inotification-provider';
import { Injectable, Logger } from '@nestjs/common';
import {
  INotificationMessageRequest,
  INotificationMessageResult,
} from '@notification/interfaces/inotification-message';

@Injectable()
export class MailChimpNotificationProvider implements INotificationProvider {
  private logger = new Logger(MailChimpNotificationProvider.name);

  async sendMessage(message: INotificationMessageRequest): Promise<INotificationMessageResult> {
    this.logger.log(`Sending message to ${message.user.email}: ${message.header} to ${message} (${message.body})`);

    return {
      transport: 'mailchimp',
      target: message.user.email,
      userId: message.user.id,
      ...message,
    };
  }
}
