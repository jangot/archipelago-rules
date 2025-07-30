import { NotificationDataItems } from '../enum/notification-data-items';

/**
 * Interface for NotificationDefinition entity
 */
export interface INotificationDefinition {
  /**
   * Unique identifier for the notification definition
   */
  id: string;

  /**
   * Name of the notification definition (must be unique)
   */
  name: string;

  /**
   * Array of notification types that this definition supports
   */
  dataItems: NotificationDataItems[];

  /**
   * Timestamp when this notification definition was created
   */
  createdAt: Date;

  /**
   * Timestamp when this notification definition was last updated
   */
  updatedAt: Date;
}