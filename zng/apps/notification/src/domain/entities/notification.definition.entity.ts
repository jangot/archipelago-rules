import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { INotificationDefinition } from '@library/entity/interface';

/**
 * Entity representing a notification definition
 * 
 * @description This entity stores notification definitions used by the notification system
 */
@Entity('notification_definitions', { schema: 'notification' })
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
