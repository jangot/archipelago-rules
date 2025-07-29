import { MailChimpNotificationProvider } from '@notification/providers/mail-chimp-notification-provider';
import { TwilioNotificationProvider } from '@notification/providers/twilio-notification-provider';

export * from '@notification/providers/mail-chimp-notification-provider';
export * from '@notification/providers/twilio-notification-provider';

export const NOTIFICATION_PROVIDERS = [MailChimpNotificationProvider, TwilioNotificationProvider];

