import { NotificationType } from '@library/entity/enum/notification.type';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * DTO for updating an existing notification definition item
 */
export class UpdateNotificationDefinitionItemRequestDto {
  /**
   * Reference to the parent notification definition
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  @ApiProperty({
    description: 'Reference to the parent notification definition',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Notification definition ID must be a valid UUID' })
  notificationDefinitionId?: string;

  /**
   * Order index for sorting notification items within a definition
   * @example 1
   */
  @ApiProperty({
    description: 'Order index for sorting notification items within a definition',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Order index must be a number' })
  orderIndex?: number;

  /**
   * Type of notification (Email, SMS, Amplitude)
   * @example 'Email'
   */
  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: NotificationType.Email,
    required: false,
  })
  @IsOptional()
  @IsEnum(NotificationType, { message: 'Notification type must be a valid enum value' })
  notificationType?: NotificationType;

  /**
   * Template string for the notification content
   * @example 'Hello {{name}}, your payment is due on {{dueDate}}'
   */
  @ApiProperty({
    description: 'Template string for the notification content',
    example: 'Hello {{name}}, your payment is due on {{dueDate}}',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Template must be a string' })
  template?: string;

  /**
   * Header text for the notification
   * @example 'Payment Reminder'
   */
  @ApiProperty({
    description: 'Header text for the notification',
    example: 'Payment Reminder',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Header must be a string' })
  header?: string;

  /**
   * Body text for the notification
   * @example 'Your payment of $100 is due on 2025-01-15'
   */
  @ApiProperty({
    description: 'Body text for the notification',
    example: 'Your payment of $100 is due on 2025-01-15',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Body must be a string' })
  body?: string;

  /**
   * Target destination for the notification
   * @example 'user@example.com'
   */
  @ApiProperty({
    description: 'Target destination for the notification',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Target must be a string' })
  target?: string;

  /**
   * Additional metadata for the notification item
   * @example '{"priority": "high", "category": "payment"}'
   */
  @ApiProperty({
    description: 'Additional metadata for the notification item',
    example: '{"priority": "high", "category": "payment"}',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Metadata must be a string' })
  metadata?: string;
}