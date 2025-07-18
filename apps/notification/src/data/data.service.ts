import { IDataService } from '@library/shared/common/data/idata.service';
import { Injectable } from '@nestjs/common';
import { NotificationDefinitionRepository } from '../infrastructure/repositories';

/**
 * Data service for the Notification module
 * Provides access to all notification-related repositories
 */
@Injectable()
export class NotificationDataService extends IDataService {
  constructor(
    public readonly notificationDefinitions: NotificationDefinitionRepository
  ) {
    super();
  }
}

//@Inject(IUserRepository) public readonly users: IUserRepository,
