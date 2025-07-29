import { Injectable } from '@nestjs/common';
import { INotificationProvider } from '@notification/interfaces/inotification-provider';
import { AmplitudeNotificationProvider, MandrillNotificationProvider, TwilioNotificationProvider } from '@notification/providers/index';
import { NotificationType } from '@library/entity';

@Injectable()
export class NotificationProviderFactory {
  constructor(
    private readonly mailChimpNotificationProvider: MandrillNotificationProvider,
    private readonly twilioNotificationProvider: TwilioNotificationProvider,
    private readonly amplitudeNotificationProvider: AmplitudeNotificationProvider,
  ) {}

  getProvider(provider: string): INotificationProvider {
    switch (provider) {
      case NotificationType.Email:
        return this.mailChimpNotificationProvider;
      case NotificationType.SMS:
        return this.twilioNotificationProvider;
      case NotificationType.Amplitude:
        return this.amplitudeNotificationProvider;
      default:
        throw new Error(`Provider ${provider} is not supported`);
    }
  }
}
