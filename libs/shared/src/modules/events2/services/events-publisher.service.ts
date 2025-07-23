import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { ICoreEvent } from '@library/shared/modules/events2/interface';
import { SnsPublisherService } from '@library/shared/modules/events2/services/sns-publisher.service';

@Injectable()
export class EventsPublisherService {
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
