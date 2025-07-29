import { NotificationType } from '@library/entity/enum/notification.type';
import { INotificationDefinitionItem } from '@library/entity/interface/notification-definition-item.interface';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { NotificationDefinition } from '@notification/domain/entity/notification.definition.entity';
import { NotificationDataItems } from '@library/entity/enum/notification-data-items';

/**
 * Entity representing a notification definition item
 *
 * @description This entity stores individual notification items that belong to a notification definition
 */
@Entity('notification_definition_items', { schema: 'notifications' })
export class NotificationDefinitionItem implements INotificationDefinitionItem {
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
  @JoinColumn({ name: 'notificationDefinitionId' })
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

  @Column('jsonb', { nullable: false, default: '{}' })
  attributes: object;

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
