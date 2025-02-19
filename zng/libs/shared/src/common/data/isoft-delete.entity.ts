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
export interface ISoftDeleteEntity {
  deletedAt?: Date | null;
}
