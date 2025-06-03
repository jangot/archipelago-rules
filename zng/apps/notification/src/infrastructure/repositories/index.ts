
import { INotificationDefinitionRepository } from '@notification/shared/interfaces/repositories/inotification.definition.repository';
import { NotificationDefinitionRepository } from './notification.definition.repository';

export * from './notification.definition.repository';

export const CustomNotificationRepositories = [
  { provide: INotificationDefinitionRepository, useClass: NotificationDefinitionRepository },
  // Add other notification repositories here
];
