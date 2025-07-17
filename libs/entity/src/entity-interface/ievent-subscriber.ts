import { EventSubscriberServiceName } from '../enum/event-subscriber-service-name';

export interface IEventSubscriber {
  id: string;
  name?: string | null;
  eventName: string;
  subscriberService: EventSubscriberServiceName;
  description?: string | null;
  destination: string;
  createdAt: Date;
  isDeleted: boolean;
}
