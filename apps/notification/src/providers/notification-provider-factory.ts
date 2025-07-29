import { Injectable } from '@nestjs/common';
import { INotificationProvider } from '@notification/interfaces/inotification-provider';
import { MailChimpNotificationProvider, TwilioNotificationProvider } from '@notification/providers/index';

@Injectable()
export class NotificationProviderFactory {
  constructor(
    private readonly mailChimpNotificationProvider: MailChimpNotificationProvider,
    private readonly twilioNotificationProvider: TwilioNotificationProvider,
  ) {}

  getProvider(provider: string): INotificationProvider {
    switch (provider) {
      case 'email':
        return this.mailChimpNotificationProvider;
      case 'sms':
        return this.twilioNotificationProvider;
      default:
        throw new Error(`Provider ${provider} is not supported`);
    }
  }
}
