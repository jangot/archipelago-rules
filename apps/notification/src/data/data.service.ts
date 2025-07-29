import { IDataService } from '@library/shared/common/data/idata.service';
import { Injectable } from '@nestjs/common';
import { NotificationDefinitionItemRepository } from '@notification/infrastructure/repositories';
import { NotificationDefinitionRepository } from '@notification/infrastructure/repositories';

/**
 * Data service for the Notification module
 * Provides access to all notification-related repositories
 */
@Injectable()
export class NotificationDataService extends IDataService {
  constructor(
    public readonly notificationDefinitions: NotificationDefinitionRepository,
    public readonly notificationDefinitionItems: NotificationDefinitionItemRepository
  ) {
    super();
  }
}

//@Inject(IUserRepository) public readonly users: IUserRepository,
