import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

import { ICoreEvent, IEventsPublisher } from '../interface';
import { SnsPublisherService } from './sns-publisher.service';

@Injectable()
export class EventsPublisherService implements IEventsPublisher {
  constructor(
    private readonly eventBus: EventBus,
    private readonly snsPublisher: SnsPublisherService,
  ) {}

  public async publish<T extends  ICoreEvent<any>>(event: T): Promise<void> {
    await this.eventBus.publish(event);
    if (event.type === 'CorePublishedEvent') {
      await this.snsPublisher.publish(event);
    }
  }
}
