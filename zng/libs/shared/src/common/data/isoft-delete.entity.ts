/**
 * Defines an Entity that supports Soft Delete operations.
 * Deletion of an Entity is the operation that sets the `deletedAt` field to the current date and time.
 * To restore a Soft Deleted Entity, you should call the `restore` method in repository.
 *
 * Example:
 * @Entity()
 * class User extends ISoftDeleteEntity {
 * @DeleteDateColumn()
 * deletedAt: Date;
 * }
 */
import { EntityTarget } from 'typeorm';
export interface ISoftDeleteEntity {
  deletedAt?: Date | null;
}

export function supportsSoftDelete<Entity>(target: EntityTarget<Entity>): boolean {
  // We assume that if the prototype has 'deletedAt', then the entity "implements" ISoftDeleteEntity.
  return 'deletedAt' in (target as any).prototype;
}

export function isSoftDeleteEntity(instance: any): instance is ISoftDeleteEntity {
  // eslint-disable-next-line prettier/prettier
  return instance && ('deletedAt' in instance);
}
