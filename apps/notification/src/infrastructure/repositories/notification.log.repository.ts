import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NotificationLog } from '@library/shared/domain/entity';

/**
 * Implementation of the NotificationLog repository
 *
 * @description Handles database operations for NotificationLog entities using TypeORM
 */
@Injectable()
export class NotificationLogRepository extends RepositoryBase<NotificationLog> {
  private readonly logger: Logger = new Logger(NotificationLogRepository.name);

  constructor(
    @InjectRepository(NotificationLog)
    protected readonly repository: Repository<NotificationLog>,
  ) {
    super(repository, NotificationLog);
  }
}