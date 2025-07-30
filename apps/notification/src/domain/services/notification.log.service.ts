import { BaseDomainServices } from '@library/shared/common/domainservice/domain.service.base';
import { IPaging } from '@library/shared/common/paging';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { NotificationLog } from '@library/shared/domain/entity';
import { NotificationDataService } from '@notification/data';
import { INotificationMessageResult } from '@notification/interfaces/inotification-message';

/**
 * Service for managing notification logs
 *
 * @description Handles business logic for notification logging and audit trails
 */
@Injectable()
export class NotificationLogDomainService extends BaseDomainServices {
  private readonly logger = new Logger(NotificationLogDomainService.name);

  constructor(
    protected readonly data: NotificationDataService,
    protected readonly config: ConfigService
  ) {
    super(data);
  }

  /**
   * Log a notification message result
   *
   * @param messageResult - The result of sending a notification message
   * @returns Promise<NotificationLog | null>
   */
  async logNotificationResult(messageResult: INotificationMessageResult): Promise<NotificationLog | null> {
    this.logger.debug(`Logging notification result for user ${messageResult.userId} via ${messageResult.transport}`);

    const notificationLog = new NotificationLog();
    notificationLog.target = messageResult.target;
    notificationLog.userId = messageResult.userId;
    notificationLog.transport = messageResult.transport;
    notificationLog.metadata = messageResult.metadata;
    notificationLog.header = messageResult.header;
    notificationLog.body = messageResult.body;
    notificationLog.message = messageResult.message;
    notificationLog.definitionItemId = messageResult.definitionItemId;

    return this.data.notificationLogs.insert(notificationLog, true);
  }

  /**
   * Get notification logs by user ID
   *
   * @param userId - The ID of the user to get logs for
   * @returns Promise<IPaging<NotificationLog> | null>
   */
  async getLogsByUserId(userId: string): Promise<IPaging<NotificationLog> | null> {
    this.logger.debug(`Getting notification logs for user ${userId}`);
    return this.data.notificationLogs.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get notification logs by transport method
   *
   * @param transport - The transport method to filter by
   * @returns Promise<IPaging<NotificationLog> | null>
   */
  async getLogsByTransport(transport: string): Promise<IPaging<NotificationLog> | null> {
    this.logger.debug(`Getting notification logs for transport ${transport}`);
    return this.data.notificationLogs.find({
      where: { transport },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get notification logs within a date range
   *
   * @param startDate - Start date for the range
   * @param endDate - End date for the range
   * @returns Promise<IPaging<NotificationLog> | null>
   */
  async getLogsByDateRange(startDate: Date, endDate: Date): Promise<IPaging<NotificationLog> | null> {
    this.logger.debug(`Getting notification logs between ${startDate} and ${endDate}`);
    return this.data.notificationLogs.find({
      where: {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        } as any,
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all notification logs with pagination
   *
   * @param skip - Number of records to skip
   * @param take - Number of records to take
   * @returns Promise<IPaging<NotificationLog> | null>
   */
  async getAllLogs(skip: number = 0, take: number = 100): Promise<IPaging<NotificationLog> | null> {
    this.logger.debug(`Getting notification logs with pagination: skip=${skip}, take=${take}`);
    return this.data.notificationLogs.find({
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }
}
