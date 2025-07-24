import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

import { IZirtueEvent } from '../interface';
import { EventSnsPublisherService } from './event-sns-publisher.service';
import { ZirtueDistributedEvent } from 'libs/shared/src/modules/event';

@Injectable()
export class EventPublisherService {
  constructor(
    private readonly eventBus: EventBus,
    private readonly snsPublisher: EventSnsPublisherService,
  ) {}

  public async publish<T extends IZirtueEvent<any>>(event: T): Promise<boolean> {
    await this.eventBus.publish(event);
    if (this.isCoreEvent(event) && event.type === ZirtueDistributedEvent.name) {
      await this.snsPublisher.publish(event);
    }

    // TODO fix after update all publisher
    return true;
  }

  private isCoreEvent(event: IZirtueEvent<any>): event is IZirtueEvent<any> {
    return 'type' in event && 'payload' in event;
  }
}
