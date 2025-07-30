import { INotificationLog } from '@library/entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';
import { NotificationDefinitionItem } from './notification.definition.item.entity';

/**
 * Entity representing a notification log entry
 *
 * @description This entity stores notification message results for audit and tracking purposes
 */
@Entity('notification_logs', { schema: 'notifications' })
export class NotificationLog implements INotificationLog {
  /**
   * Unique identifier for the notification log entry
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Target destination for the notification (email, phone, etc.)
   */
  @Column('text', { nullable: false })
  target: string;

  /**
   * Status of the notification
   */
  @Column('text', { nullable: false })
  status: string;

  /**
   * ID of the user who received the notification
   */
  @Column('uuid', { nullable: false })
  userId: string;

  /**
   * Transport method used for the notification (email, sms, etc.)
   */
  @Column('text', { nullable: false })
  transport: string;

  /**
   * Metadata associated with the notification
   */
  @Column('text', { nullable: false, default: '' })
  metadata: string;

  /**
   * Header text of the notification
   */
  @Column('text', { nullable: false, default: '' })
  header: string;

  /**
   * Body text of the notification
   */
  @Column('text', { nullable: false, default: '' })
  body: string;

  /**
   * Full message content of the notification
   */
  @Column('text', { nullable: false, default: '' })
  message: string;

  /**
   * Reference to the notification definition item
   */
  @Column('uuid', { nullable: false })
  definitionItemId: string;

  /**
   * Parent notification definition item
   */
  @ManyToOne(() => NotificationDefinitionItem, (definition) => definition.logs)
  @JoinColumn({ name: 'definition_item_id' })
  notificationDefinitionItem: NotificationDefinitionItem;

  /**
   * Timestamp when this notification log entry was created
   */
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  /**
   * Timestamp when this notification log entry was last updated
   */
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}