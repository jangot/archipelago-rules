import { NotificationType } from '../enum/notification.type';

/**
 * Interface for NotificationDefinitionItem entity
 *
 * @description Defines the contract for NotificationDefinitionItem entities
 */
export interface INotificationDefinitionItem {
  /**
   * Unique identifier for the notification definition item
   */
  id: string;

  /**
   * Reference to the parent notification definition
   */
  notificationDefinitionId: string;

  /**
   * Order index for sorting notification items within a definition
   */
  orderIndex: number;

  /**
   * Type of notification (Email, SMS, Amplitude)
   */
  notificationType: NotificationType;

  /**
   * Template string for the notification content
   */
  template?: string;

  /**
   * Header text for the notification
   */
  header?: string;

  /**
   * Body text for the notification
   */
  body?: string;

  /**
   * Target destination for the notification
   */
  target?: string;

  /**
   * Additional metadata for the notification item
   */
  metadata?: string;

  /**
   * Timestamp when this notification definition item was created
   */
  createdAt: Date;

  /**
   * Timestamp when this notification definition item was last updated
   */
  updatedAt: Date;
}