import { IRepositoryBase } from '@library/shared/common/data/ibase.repository';
import { INotificationDefinition } from '@library/entity/entity-interface';

/**
 * Interface for notification definition repository
 * 
 * @extends IRepositoryBase<INotificationDefinition>
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface INotificationDefinitionRepository extends IRepositoryBase<INotificationDefinition> {
  // Add custom methods here as needed
}

export const INotificationDefinitionRepository = Symbol('INotificationDefinitionRepository');
