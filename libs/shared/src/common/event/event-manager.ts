import { IEventSubscriber } from '@library/entity/entity-interface';
import { EventSubscriberServiceName } from '@library/entity/enum/event-subscriber-service-name';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { EventSubscriber } from '../../domain/entity/event.subscriber.entity';
import { IEventPublishedRepository } from '../../infrastructure/interface';
import { IEventStoreRepository } from '../../infrastructure/interface/ievent-store.repository';
import { IEventSubscriberRepository } from '../../infrastructure/interface/ievent-subscriber.repository';
import { SubscriberDestination, SubscriberServiceName } from '../../modules/events/event.constants';
import { EventSubscription } from './event-subscription';
import { IEventPublisherService } from './interface/ievent-publisher.service';
import { IEventSubscriberService } from './interface/ievent-subscriber.service';
import { IZngEvent } from './interface/izng-event';

@Injectable()
export class EventManager implements IEventPublisherService, IEventSubscriberService {
  private readonly Logger = new Logger(EventManager.name);
  
  constructor(
    private readonly eventBus: EventBus,
    @Inject(SubscriberServiceName)
    private readonly subscriberServiceName: EventSubscriberServiceName,
    @Inject(SubscriberDestination)
    private readonly subscriberDestination: string,
    @Inject(IEventSubscriberRepository)
    private readonly eventSubscribeRepository: IEventSubscriberRepository,
    @Inject(IEventStoreRepository)
    private readonly eventStoreRepository: IEventStoreRepository,
    @Inject(IEventPublishedRepository)
    private readonly eventPublishedRepository: IEventPublishedRepository
  ) { }
  
  public async subscribe(event: EventSubscription): Promise<boolean> {
    const eventSubscriber = await this.getEventSubscriber(this.subscriberServiceName, event.eventName, this.subscriberDestination);

    if (eventSubscriber) {
      // Undelete it if it was deleted, since they are trying to subscribe again
      if (eventSubscriber.isDeleted) {
        eventSubscriber.isDeleted = false;
        const result = await this.eventSubscribeRepository.update(eventSubscriber.id, eventSubscriber);
        return result;
      }
      
      return false;
    }

    const newEventSubscriber = new EventSubscriber();
    newEventSubscriber.subscriberService = this.subscriberServiceName;
    newEventSubscriber.destination = this.subscriberDestination;
    newEventSubscriber.eventName = event.eventName;
    newEventSubscriber.name = event.name || null;
    newEventSubscriber.description = event.description || null;

    const result = await this.eventSubscribeRepository.create(newEventSubscriber);

    return result.id !== null;
  }

  public async unsubscribe(eventName: string): Promise<boolean> {
    const eventSubscriber = await this.getEventSubscriber(this.subscriberServiceName, eventName, this.subscriberDestination);

    if (!eventSubscriber) {
      return false;
    }

    // Mark it as deleted
    eventSubscriber.isDeleted = true;

    const result = await this.eventSubscribeRepository.update(eventSubscriber.id, eventSubscriber);

    return result;
  }

  /**
   * Publishes an event.
   * @param event - The event to publish.
   * @returns The event.
   */
  public publish<T>(event: IZngEvent): T {
    const result =  this.eventBus.publish(event);

    
    return result as T;
  }

  private async getEventSubscriber(subscriberService: EventSubscriberServiceName, eventName: string, destination: string):
  Promise<IEventSubscriber | null> {
    const result = await this.eventSubscribeRepository.getSubscriberForEvent(subscriberService, eventName, destination);

    return result;
  }
}
