import { CoreDataService } from '@core/modules/data';
import { NotificationDataItems } from '@library/entity/enum/notification-data-items';
import { BaseDomainServices } from '@library/shared/common/domainservice/domain.service.base';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Service for managing notification definitions in core application
 *
 * @description Handles business logic for notification definitions
 */
@Injectable()
export class NotificationDomainService extends BaseDomainServices {
  private readonly logger = new Logger(NotificationDomainService.name);

  constructor(
    protected readonly data: CoreDataService,
    protected readonly config: ConfigService
  ) {
    super(data);
  }

  /**
   * Find notification definition data items by name
   *
   * @param name - The name of the notification definition to find
   * @returns Promise<NotificationDataItems[] | null>
   */
  async findByName(name: string): Promise<NotificationDataItems[] | null> {
    this.logger.debug(`Finding notification definition data items by name: ${name}`);
    const notificationDefinition = await this.data.notificationDefinitions.findByName(name);
    return notificationDefinition?.dataItems || null;
  }
}