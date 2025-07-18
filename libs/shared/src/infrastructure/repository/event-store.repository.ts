import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { EventStore } from '@library/shared/domain/entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class EventStoreRepository extends RepositoryBase<EventStore> {
  private readonly logger: Logger = new Logger(EventStoreRepository.name);

  constructor(
    @InjectRepository(EventStore)
    protected readonly repository: Repository<EventStore>
  ) {
    super(repository, EventStore);
  }

  public async getEventsByEventName(eventName: string): Promise<EventStore[]> {
    this.logger.debug(`getEventsByEventName: ${eventName}`);

    return this.repository.find({ where: { event_name: eventName }, order: { occurred_at: 'DESC' } });
  }
}
