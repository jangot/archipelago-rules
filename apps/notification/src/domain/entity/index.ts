import { NotificationDefinition } from '@notification/domain/entity/notification.definition.entity';
import { NotificationDefinitionItem } from '@notification/domain/entity/notification.definition.item.entity';
import { NotificationLog } from '@notification/domain/entity/notification.log.entity';

export * from '@notification/domain/entity/notification.definition.entity';
export * from '@notification/domain/entity/notification.definition.item.entity';
export * from '@notification/domain/entity/notification.log.entity';

export const NotificationEntities = [NotificationDefinition, NotificationDefinitionItem, NotificationLog];
