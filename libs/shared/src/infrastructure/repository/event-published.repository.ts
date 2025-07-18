import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { EventPublished } from '@library/shared/domain/entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class EventPublishedRepository extends RepositoryBase<EventPublished> {
  private readonly logger: Logger = new Logger(EventPublishedRepository.name);

  constructor(
    @InjectRepository(EventPublished)
    protected readonly repository: Repository<EventPublished>
  ) {
    super(repository, EventPublished);
  }
}
