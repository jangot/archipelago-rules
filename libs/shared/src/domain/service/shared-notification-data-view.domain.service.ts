import { Injectable, Logger } from '@nestjs/common';
import { BaseDomainServices } from '@library/shared/common/domainservice';
import { SharedDataService } from '@library/shared/common/domainservice/shared.service';
import { ConfigService } from '@nestjs/config';
import { NotificationEventPayload } from '@library/shared/events/notification.event';
import { NotificationDataItems } from '@library/entity/enum/notification-data-items';

@Injectable()
export class SharedNotificationDataViewDomainService extends BaseDomainServices {
  private readonly logger = new Logger(SharedNotificationDataViewDomainService.name);

  constructor(
    protected readonly data: SharedDataService,
    protected readonly config: ConfigService
  ) {
    super(data);
  }

  async getPayload(name: string, userId: string, includeData: NotificationDataItems[]): Promise<NotificationEventPayload | null> {
    this.logger.debug(`Find notification data for user: ${userId}`);

    const row = await this.data.notificatioDataView.findByUserId(userId, includeData);
    if (!row) {
      return null;
    }

    const result: NotificationEventPayload = {
      name,
      user: row.user,
    };

    if (row[NotificationDataItems.Loan]) {
      result[NotificationDataItems.Loan] = row[NotificationDataItems.Loan];
    }

    return result;
  }
}
