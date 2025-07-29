import { Injectable } from '@nestjs/common';
import { MailChimpNotificationProvider } from '@notification/providers/index';
import { INotificationProvider } from '@notification/interfaces/inotification-provider';

@Injectable()
export class NotificationProviderFactory {
  constructor(private readonly mailChimpNotificationProvider: MailChimpNotificationProvider) {}

  getProvider(provider: string): INotificationProvider {
    switch (provider) {
      case 'email':
        return this.mailChimpNotificationProvider;
      default:
        throw new Error(`Provider ${provider} is not supported`);
    }
  }
}
