import { NotificationDefinition } from '@notification/domain/entity/notification.definition.entity';
import { NotificationDefinitionItem } from '@notification/domain/entity/notification.definition.item.entity';

export * from '@notification/domain/entity/notification.definition.entity';
export * from '@notification/domain/entity/notification.definition.item.entity';

export const NotificationEntities = [NotificationDefinition, NotificationDefinitionItem];
