import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationDefinition } from '../../domain/entities/notification.definition.entity';
import { INotificationDefinitionRepository } from '../../domain/interfaces/inotification.definition.repository';
import { RepositoryBase } from '@library/shared/common/data/base.repository';

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
    repository: Repository<NotificationDefinition>,
  ) {
    super(repository, NotificationDefinition);
  }
}
