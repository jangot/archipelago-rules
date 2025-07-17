import { EventSubscription } from '../event-subscription';

export interface IEventSubscriberService {
  subscribe(event: EventSubscription): Promise<boolean>;
  unsubscribe(eventName: string): Promise<boolean>;
}
