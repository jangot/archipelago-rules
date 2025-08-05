import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { NotificationDefinition } from '@library/shared/domain/entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/**
 * Repository for NotificationDefinition entity
 */
@Injectable()
export class NotificationDefinitionRepository extends RepositoryBase<NotificationDefinition> {
  private readonly logger: Logger = new Logger(NotificationDefinitionRepository.name);

  constructor(
    @InjectRepository(NotificationDefinition)
    repository: Repository<NotificationDefinition>,
  ) {
    super(repository, NotificationDefinition);
  }

  /**
   * Find notification definition by name
   * @param name - The name of the notification definition
   * @returns Promise<NotificationDefinition | null>
   */
  async findByName(name: string): Promise<NotificationDefinition | null> {
    this.logger.debug(`Finding notification definition by name: ${name}`);
    return this.repository.findOne({
      where: { name },
    });
  }
}