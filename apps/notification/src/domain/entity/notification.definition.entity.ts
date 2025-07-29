import { INotificationDefinition, NotificationType } from '@library/entity';
import { NotificationDefinitionItem } from '@notification/domain/entity/notification.definition.item.entity';
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { NotificationDataItems } from '@library/entity/enum/notification-data-items';

/**
 * Entity representing a notification definition
 *
 * @description This entity stores notification definitions used by the notification system
 */
@Entity('notification_definitions', { schema: 'notifications' })
export class NotificationDefinition implements INotificationDefinition {
  /**
   * Unique identifier for the notification definition
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Name of the notification definition
   */
  @Column('text', { nullable: false })
  name: string;

  /**
   * Array of notification types that this definition supports
   * Stored as JSON array in the database
   */
  @Column('jsonb', { nullable: false, default: '[]' })
  dataItems: NotificationDataItems[];

  /**
   * Notification definition items associated with this definition
   */
  @OneToMany(() => NotificationDefinitionItem, (item) => item.notificationDefinition)
  items: NotificationDefinitionItem[];

  /**
   * Timestamp when this notification definition was created
   */
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  /**
   * Timestamp when this notification definition was last updated
   */
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
