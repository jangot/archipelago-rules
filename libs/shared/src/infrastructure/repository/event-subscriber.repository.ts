import { EventSubscriberServiceName } from '@library/entity/enum/event-subscriber-service-name';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { EventSubscriber } from '@library/shared/domain/entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class EventSubscriberRepository extends RepositoryBase<EventSubscriber> {
  private readonly logger: Logger = new Logger(EventSubscriberRepository.name);

  constructor(
    @InjectRepository(EventSubscriber)
    protected readonly repository: Repository<EventSubscriber>
  ) {
    super(repository, EventSubscriber);
  }

  public async getSubscribersByServiceName(subscriberService: EventSubscriberServiceName): Promise<EventSubscriber[]> {
    throw new Error('Method not implemented.');
  }
  
  public async getSubscribersByEventName(eventName: string): Promise<EventSubscriber[]> {
    throw new Error('Method not implemented.');
  }

  public async getSubscriberForEvent(subscriberService: EventSubscriberServiceName, eventName: string, destination: string):
  Promise<EventSubscriber | null> {
    const result = await this.repository.findOne({
      where: {
        subscriberService,
        eventName,
        destination,
      },
    });

    return result;
  }
}
