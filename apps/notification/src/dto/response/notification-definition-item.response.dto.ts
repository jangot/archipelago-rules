import { NotificationType } from '@library/entity/enum/notification.type';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * DTO for notification definition item responses
 */
export class NotificationDefinitionItemResponseDto {
  /**
   * Unique identifier of the notification definition item
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  @Expose()
  @ApiProperty({
    description: 'Unique identifier of the notification definition item',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  /**
   * Reference to the parent notification definition
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  @Expose()
  @ApiProperty({
    description: 'Reference to the parent notification definition',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  notificationDefinitionId: string;

  /**
   * Order index for sorting notification items within a definition
   * @example 1
   */
  @Expose()
  @ApiProperty({
    description: 'Order index for sorting notification items within a definition',
    example: 1,
  })
  orderIndex: number;

  /**
   * Type of notification (Email, SMS, Amplitude)
   * @example 'Email'
   */
  @Expose()
  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: NotificationType.Email,
  })
  notificationType: NotificationType;

  /**
   * Template string for the notification content
   * @example 'Hello {{name}}, your payment is due on {{dueDate}}'
   */
  @Expose()
  @ApiProperty({
    description: 'Template string for the notification content',
    example: 'Hello {{name}}, your payment is due on {{dueDate}}',
    required: false,
  })
  template?: string;

  /**
   * Header text for the notification
   * @example 'Payment Reminder'
   */
  @Expose()
  @ApiProperty({
    description: 'Header text for the notification',
    example: 'Payment Reminder',
    required: false,
  })
  header?: string;

  /**
   * Body text for the notification
   * @example 'Your payment of $100 is due on 2025-01-15'
   */
  @Expose()
  @ApiProperty({
    description: 'Body text for the notification',
    example: 'Your payment of $100 is due on 2025-01-15',
    required: false,
  })
  body?: string;

  /**
   * Target destination for the notification
   * @example 'user@example.com'
   */
  @Expose()
  @ApiProperty({
    description: 'Target destination for the notification',
    example: 'user@example.com',
    required: false,
  })
  target?: string;

  /**
   * Additional metadata for the notification item
   * @example '{"priority": "high", "category": "payment"}'
   */
  @Expose()
  @ApiProperty({
    description: 'Additional metadata for the notification item',
    example: '{"priority": "high", "category": "payment"}',
    required: false,
  })
  metadata?: string;

  /**
   * Timestamp when the notification definition item was created
   * @example '2025-04-11T14:30:00Z'
   */
  @Expose()
  @ApiProperty({
    description: 'Timestamp when the notification definition item was created',
    example: '2025-04-11T14:30:00Z',
  })
  createdAt: Date;

  /**
   * Timestamp when the notification definition item was last updated
   * @example '2025-04-11T15:45:00Z'
   */
  @Expose()
  @ApiProperty({
    description: 'Timestamp when the notification definition item was last updated',
    example: '2025-04-11T15:45:00Z',
  })
  updatedAt: Date;
}