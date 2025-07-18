import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RepositoryBase } from '../../common/data/base.repository';
import { EventPublished } from '../../domain/entity';
import { IEventPublishedRepository } from '../interface';

@Injectable()
export class EventPublishedRepository extends RepositoryBase<EventPublished> implements IEventPublishedRepository {
  private readonly logger: Logger = new Logger(EventPublishedRepository.name);

  constructor(
    @InjectRepository(EventPublished)
    protected readonly repository: Repository<EventPublished>,
  ) {
    super(repository, EventPublished);
  }
}
