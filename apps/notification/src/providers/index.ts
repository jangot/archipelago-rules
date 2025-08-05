import { AmplitudeNotificationProvider } from '@notification/providers/amplitude-notification-provider';
import { MandrillNotificationProvider } from '@notification/providers/mandrill-notification-provider';
import { TwilioNotificationProvider } from '@notification/providers/twilio-notification-provider';

export * from '@notification/providers/amplitude-notification-provider';
export * from '@notification/providers/mandrill-notification-provider';
export * from '@notification/providers/twilio-notification-provider';

export const NOTIFICATION_PROVIDERS = [MandrillNotificationProvider, TwilioNotificationProvider, AmplitudeNotificationProvider];

