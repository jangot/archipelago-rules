/**
 * Interface for NotificationLog entity
 *
 * @description Defines the contract for NotificationLog entities that store notification message results
 */
export interface INotificationLog {
  /**
   * Unique identifier for the notification log entry
   */
  id: string;

  /**
   * Target destination for the notification (email, phone, etc.)
   */
  target: string;

  /**
   * ID of the user who received the notification
   */
  userId: string;

  /**
   * Transport method used for the notification (email, sms, etc.)
   */
  transport: string;

  /**
   * Metadata associated with the notification
   */
  metadata: string;

  /**
   * Header text of the notification
   */
  header: string;

  /**
   * Body text of the notification
   */
  body: string;

  /**
   * Full message content of the notification
   */
  message: string;

  /**
   * Timestamp when this notification log entry was created
   */
  createdAt: Date;

  /**
   * Timestamp when this notification log entry was last updated
   */
  updatedAt: Date;
}