import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NotificationDefinition } from '@library/shared/domain/entity';

/**
 * Implementation of the NotificationDefinition repository
 *
 * @description Handles database operations for NotificationDefinition entities using TypeORM
 */
@Injectable()
export class NotificationDefinitionRepository extends RepositoryBase<NotificationDefinition> {
  private readonly logger: Logger = new Logger(NotificationDefinitionRepository.name);

  constructor(
    @InjectRepository(NotificationDefinition)
    protected readonly repository: Repository<NotificationDefinition>,
  ) {
    super(repository, NotificationDefinition);
  }

  public findByName(name: string) {
    return this.repository.findOne({ where: { name } });
  }
}
