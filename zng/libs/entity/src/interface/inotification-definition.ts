// filepath: /Users/mleduc/work/zirtue/zirtue-next-gen-platform/zng/libs/entity/src/interface/inotification-definition.ts
import { EntityId } from '@library/shared/common/data';

/**
 * Interface for notification definition entities
 * 
 * @description This interface defines the structure for notification definitions used by the notification system
 */
export interface INotificationDefinition extends EntityId<string> {
  /**
   * Unique identifier for the notification definition
   */
  id: string;

  /**
   * Name of the notification definition
   */
  name: string;

  /**
   * Timestamp when this notification definition was created
   */
  createdAt: Date;

  /**
   * Timestamp when this notification definition was last updated
   */
  updatedAt: Date;
}
