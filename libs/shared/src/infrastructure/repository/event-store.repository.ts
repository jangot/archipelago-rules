import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IEventStore } from '../../../../entity/src/entity-interface';
import { RepositoryBase } from '../../common/data/base.repository';
import { EventStore } from '../../domain/entity';
import { IEventStoreRepository } from '../interface';

@Injectable()
export class EventStoreRepository extends RepositoryBase<EventStore> implements IEventStoreRepository {
  private readonly logger: Logger = new Logger(EventStoreRepository.name);
  
  constructor(
    @InjectRepository(EventStore)
    protected readonly repository: Repository<EventStore>,
  ) {
    super(repository, EventStore);
  }

  public async getEventsByEventName(eventName: string): Promise<IEventStore[]> {
    this.logger.debug(`getEventsByEventName: ${eventName}`);

    return this.repository.find({ where: { event_name: eventName }, order: { occurred_at: 'DESC' } });
  }
}
