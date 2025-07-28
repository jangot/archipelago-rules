import { ZirtueEvent } from '@library/shared/modules/event';

export class NotificationEventPayload {
  name: string;
}

export class NotificationEvent extends ZirtueEvent <NotificationEventPayload> {}
