import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationDefinitionItem } from '../../domain/entity';

/**
 * Implementation of the NotificationDefinitionItem repository
 *
 * @description Handles database operations for NotificationDefinitionItem entities using TypeORM
 */
@Injectable()
export class NotificationDefinitionItemRepository extends RepositoryBase<NotificationDefinitionItem> {
  private readonly logger: Logger = new Logger(NotificationDefinitionItemRepository.name);

  constructor(
    @InjectRepository(NotificationDefinitionItem)
    protected readonly repository: Repository<NotificationDefinitionItem>,
  ) {
    super(repository, NotificationDefinitionItem);
  }
}
