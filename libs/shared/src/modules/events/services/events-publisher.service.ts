import { Injectable } from '@nestjs/common';
import { EventBus, IEvent } from '@nestjs/cqrs';

import { IZirtueEvent, IEventsPublisher } from '../interface';
import { SnsPublisherService } from './sns-publisher.service';
import { ZirtueDistributedEvent } from '@library/shared/modules/events';

// TODO remove after changing all old events
type Event = IEvent | IZirtueEvent<any>;

@Injectable()
export class EventsPublisherService implements IEventsPublisher {
  constructor(
    private readonly eventBus: EventBus,
    private readonly snsPublisher: SnsPublisherService,
  ) {}

  public async publish<T extends Event>(event: T): Promise<boolean> {
    await this.eventBus.publish(event);
    if (this.isCoreEvent(event) && event.type === ZirtueDistributedEvent.name) {
      await this.snsPublisher.publish(event);
    }

    // TODO fix after update all publisher
    return true;
  }

  private isCoreEvent(event: Event): event is IZirtueEvent<any> {
    return 'type' in event && 'payload' in event;
  }
}
