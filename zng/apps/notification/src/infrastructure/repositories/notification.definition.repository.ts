import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { NotificationDefinition } from '@notification/domain/entities';
import { INotificationDefinitionRepository } from '@notification/shared/interfaces/repositories/inotification.definition.repository';

/**
 * Implementation of the NotificationDefinition repository
 * 
 * @description Handles database operations for NotificationDefinition entities using TypeORM
 */
@Injectable()
export class NotificationDefinitionRepository extends RepositoryBase<NotificationDefinition> implements INotificationDefinitionRepository {
  private readonly logger: Logger = new Logger(NotificationDefinitionRepository.name);
  
  constructor(
    @InjectRepository(NotificationDefinition)
    protected readonly repository: Repository<NotificationDefinition>,
  ) {
    super(repository, NotificationDefinition);
  }
}
