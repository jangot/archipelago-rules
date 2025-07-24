import { Injectable } from '@nestjs/common';
import { EventBus, IEvent } from '@nestjs/cqrs';

import { IZirtueEvent } from '../interface';
import { EventSnsPublisherService } from './event-sns-publisher.service';
import { ZirtueDistributedEvent } from 'libs/shared/src/modules/event';

// TODO remove after changing all old events
type Event = IEvent | IZirtueEvent<any>;

@Injectable()
export class EventPublisherService {
  constructor(
    private readonly eventBus: EventBus,
    private readonly snsPublisher: EventSnsPublisherService,
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
