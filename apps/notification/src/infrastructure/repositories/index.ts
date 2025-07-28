
import { NotificationDefinitionItemRepository } from './notification.definition.item.repository';
import { NotificationDefinitionRepository } from './notification.definition.repository';

export * from './notification.definition.item.repository';
export * from './notification.definition.repository';

export const CustomNotificationRepositories = [
  NotificationDefinitionRepository,
  NotificationDefinitionItemRepository,
  // Add other notification repositories here
];
