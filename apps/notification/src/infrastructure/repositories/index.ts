
import { NotificationDefinitionRepository } from './notification.definition.repository';

export * from './notification.definition.repository';

export const CustomNotificationRepositories = [
  { provide: NotificationDefinitionRepository, useClass: NotificationDefinitionRepository },
  // Add other notification repositories here
];
