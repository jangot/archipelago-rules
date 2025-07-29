
import { NotificationDefinitionItemRepository } from '@notification/infrastructure/repositories/notification.definition.item.repository';
import { NotificationDefinitionRepository } from '@notification/infrastructure/repositories/notification.definition.repository';

export * from '@notification/infrastructure/repositories/notification.definition.item.repository';
export * from '@notification/infrastructure/repositories/notification.definition.repository';

export const CustomNotificationRepositories = [
  NotificationDefinitionRepository,
  NotificationDefinitionItemRepository,
  // Add other notification repositories here
];
