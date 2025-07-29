
import { NotificationDefinitionItemRepository } from '@notification/infrastructure/repositories/notification.definition.item.repository';
import { NotificationDefinitionRepository } from '@notification/infrastructure/repositories/notification.definition.repository';
import { NotificationLogRepository } from '@notification/infrastructure/repositories/notification.log.repository';

export * from '@notification/infrastructure/repositories/notification.definition.item.repository';
export * from '@notification/infrastructure/repositories/notification.definition.repository';
export * from '@notification/infrastructure/repositories/notification.log.repository';

export const CustomNotificationRepositories = [
  NotificationDefinitionRepository,
  NotificationDefinitionItemRepository,
  NotificationLogRepository,
  // Add other notification repositories here
];
