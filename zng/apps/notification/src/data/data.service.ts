import { Inject, Injectable } from '@nestjs/common';
import { INotificationDefinitionRepository } from '../shared/interfaces/repositories/inotification.definition.repository';
import { IDataService } from '@library/shared/common/data/idata.service';

/**
 * Data service for the Notification module
 * Provides access to all notification-related repositories
 */
@Injectable()
export class NotificationDataService extends IDataService {
  constructor(
    @Inject(INotificationDefinitionRepository) public readonly notificationDefinitions: INotificationDefinitionRepository
  ) {
    super();
  }
}
