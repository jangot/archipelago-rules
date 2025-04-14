import { IRepositoryBase } from '@library/shared/common/data/ibase.repository';
import { INotificationDefinition } from '@library/entity/interface';

/**
 * Interface for the NotificationDefinition repository
 * 
 * @description Defines methods for interacting with NotificationDefinition entities in the database
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface INotificationDefinitionRepository extends IRepositoryBase<INotificationDefinition> {
  // Base repository methods are inherited from IRepositoryBase
}

export const INotificationDefinitionRepository = Symbol('INotificationDefinitionRepository');
