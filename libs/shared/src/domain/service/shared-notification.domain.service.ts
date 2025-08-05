import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';

import { NotificationDataItems } from '@library/entity/enum/notification-data-items';
import { BaseDomainServices } from '@library/shared/common/domainservice/domain.service.base';
import { SharedDataService } from '@library/shared/common/domainservice/shared.service';
import { NotificationEventPayload } from '@library/shared/events/notification.event';

/**
 * Service for managing notification definitions in core application
 *
 * @description Handles business logic for notification definitions
 */
@Injectable()
export class SharedNotificationDomainService extends BaseDomainServices {
  private readonly logger = new Logger(SharedNotificationDomainService.name);

  constructor(
    protected readonly data: SharedDataService,
    protected readonly config: ConfigService
  ) {
    super(data);
  }

  public async getNotificationPayload(notificationName: string, userId: string, params = {}): Promise<NotificationEventPayload | null> {
    const notificationDefinition = await this.data.notificationDefinitions.findByName(notificationName);
    if (!notificationDefinition) {
      this.logger.debug(`Notification definition was not gotten: ${notificationName}`);
      return null;
    }
    const row = await this.data.notificatioDataView.findByUserId(userId, notificationDefinition.dataItems);
    if (!row) {
      this.logger.debug(`Notification data was not gotten ${notificationName} : ${userId}`);
      return null;
    }

    return {
      name: notificationName,
      user: row.user,
      lenderLoan: row[NotificationDataItems.LenderLoan] || undefined,
      borrowerLoan: row[NotificationDataItems.BorrowerLoan] || undefined,
      params,
    };
  }
}
