import { Injectable } from '@nestjs/common';
import { EventBus, IEvent } from '@nestjs/cqrs';

import { ICoreEvent, IEventsPublisher } from '../interface';
import { SnsPublisherService } from './sns-publisher.service';

// TODO remove after changing all old events
type Event = IEvent | ICoreEvent<any>;

@Injectable()
export class EventsPublisherService implements IEventsPublisher {
  constructor(
    private readonly eventBus: EventBus,
    private readonly snsPublisher: SnsPublisherService,
  ) {}

  public async publish<T extends Event>(event: T): Promise<void> {
    await this.eventBus.publish(event);
    if (this.isCoreEvent(event) && event.type === 'CorePublishedEvent') {
      await this.snsPublisher.publish(event);
    }
  }

  private isCoreEvent(event: Event): event is ICoreEvent<any> {
    return 'type' in event && 'payload' in event;
  }
}
