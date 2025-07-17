import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationDefinition } from '@notification/domain/entity';
import { INotificationDefinitionRepository } from '@notification/shared/interfaces/repositories/inotification.definition.repository';
import { Repository } from 'typeorm';

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
