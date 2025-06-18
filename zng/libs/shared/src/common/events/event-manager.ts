import { Injectable } from '@nestjs/common';
import { IEventPublisher } from './interfaces/ieventpublisher';
import { EventBus } from '@nestjs/cqrs';
import { IZngEvent } from './interfaces/izng-event';

@Injectable()
export class EventManager implements IEventPublisher {
  constructor(private readonly eventBus: EventBus) {}

  /**
   * Publishes an event.
   * @param event - The event to publish.
   * @returns The event.
   */
  public publish<T>(event: IZngEvent): T {
    const result =  this.eventBus.publish(event);

    
    return result as T;
  }
}
