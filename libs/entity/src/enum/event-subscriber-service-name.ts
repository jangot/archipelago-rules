export const EventSubscriberServiceNameCodes = {
  Core: 'core',
  Payment: 'payment',
  Notification: 'notification',
} as const;

export type EventSubscriberServiceName = typeof EventSubscriberServiceNameCodes[keyof typeof EventSubscriberServiceNameCodes];
