import { IEventSubscriber } from '@library/entity/entity-interface';
import { EventSubscriberServiceName } from '@library/entity/enum/event-subscriber-service-name';
import { IRepositoryBase } from '@library/shared/common/data';

export interface IEventSubscriberRepository extends IRepositoryBase<IEventSubscriber> {
  getSubscribersByServiceName(subscriberService: EventSubscriberServiceName): Promise<IEventSubscriber[]>;
  getSubscribersByEventName(eventName: string): Promise<IEventSubscriber[]>;
  getSubscriberForEvent(subscriberService: EventSubscriberServiceName, eventName: string, destination: string): Promise<IEventSubscriber | null>;
}

export const IEventSubscriberRepository = Symbol('IEventSubscriberRepository');
