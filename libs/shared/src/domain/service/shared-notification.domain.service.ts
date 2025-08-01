import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';

import { NotificationDataItems } from '@library/entity/enum/notification-data-items';
import { BaseDomainServices } from '@library/shared/common/domainservice/domain.service.base';
import { SharedDataService } from '@library/shared/common/domainservice/shared.service';
import { IDataService } from '@library/shared/common/data/idata.service';

/**
 * Service for managing notification definitions in core application
 *
 * @description Handles business logic for notification definitions
 */
@Injectable()
export class SharedNotificationDomainService extends BaseDomainServices {
  private readonly logger = new Logger(SharedNotificationDomainService.name);

  constructor(
    protected readonly data: IDataService,
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
  async findDataItemsByName(name: string): Promise<NotificationDataItems[] | null> {
    this.logger.debug(`Finding notification definition data items by name: ${name}`);
    const notificationDefinition = await this.data.notificationDefinitions.findByName(name);
    return notificationDefinition?.dataItems || null;
  }
}
