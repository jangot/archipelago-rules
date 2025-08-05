import { Injectable } from '@nestjs/common';
import { NotificationDefinitionItemRepository, NotificationDefinitionRepository, NotificationLogRepository } from '@notification/infrastructure/repositories';
import { BillersRepository } from '@library/shared/infrastructure/repository';
import {
  NotificationDataViewRepository
} from '@library/shared/infrastructure/repository/notification-data.view.repository';

/**
 * Data service for the Notification module
 * Provides access to all notification-related repositories
 */
@Injectable()
export class NotificationDataService {
  constructor(
    public readonly billers: BillersRepository,
    public readonly notificationDefinitions: NotificationDefinitionRepository,
    public readonly notificationDefinitionItems: NotificationDefinitionItemRepository,
    public readonly notificationLogs: NotificationLogRepository,
    public readonly notificationDataView: NotificationDataViewRepository,
  ) {}
}
