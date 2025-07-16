import { EventSubscriberServiceName } from '../enum/event-subscriber-service-name';

export interface IEventSubscriber {
  id: string;
  name: string;
  subscriber: EventSubscriberServiceName;
  description: string;
  destination: string;
}
