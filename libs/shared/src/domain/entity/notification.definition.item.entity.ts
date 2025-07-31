import { NotificationType } from '@library/entity/enum/notification.type';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';
import { NotificationDefinition } from './notification.definition.entity';
import { NotificationLog } from './notification.log.entity';


/**
 * Entity representing a notification definition item
 *
 * @description This entity stores individual notification items that belong to a notification definition
 */
@Entity('notification_definition_items', { schema: 'notifications' })
export class NotificationDefinitionItem {
  /**
   * Unique identifier for the notification definition item
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Reference to the parent notification definition
   */
  @Column('uuid', { nullable: false })
  notificationDefinitionId: string;

  /**
   * Parent notification definition
   */
  @ManyToOne(() => NotificationDefinition, (definition) => definition.items)
  @JoinColumn({ name: 'notification_definition_id' })
  notificationDefinition: NotificationDefinition;

  /**
   * Order index for sorting notification items within a definition
   */
  @Column('integer', { nullable: false })
  orderIndex: number;

  /**
   * Type of notification (Email, SMS, Amplitude)
   */
  @Column('enum', { enum: NotificationType, nullable: false })
  notificationType: NotificationType;

  /**
   * Template string for the notification content
   */
  @Column('text', { nullable: true })
  template?: string;

  /**
   * Header text for the notification
   */
  @Column('text', { nullable: true })
  header?: string;

  /**
   * Body text for the notification
   */
  @Column('text', { nullable: true })
  body?: string;

  /**
   * Target destination for the notification
   */
  @Column('text', { nullable: true })
  target?: string;

  /**
   * Additional metadata for the notification item
   */
  @Column('text', { nullable: true })
  metadata?: string;

  /**
   * Any additional params for specific provider
   */
  @Column('jsonb', { nullable: false, default: '{}' })
  attributes: Record<string, any>;

  /**
   * Notification logs associated with this definition items
   */
  @OneToMany(() => NotificationLog, (item) => item.notificationDefinitionItem)
  logs: NotificationLog[];

  /**
   * Timestamp when this notification definition item was created
   */
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  /**
   * Timestamp when this notification definition item was last updated
   */
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
