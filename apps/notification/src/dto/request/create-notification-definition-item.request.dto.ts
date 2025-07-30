import { NotificationType } from '@library/entity/enum/notification.type';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * DTO for creating a new notification definition item
 */
export class CreateNotificationDefinitionItemRequestDto {
  /**
   * Reference to the parent notification definition
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  @ApiProperty({
    description: 'Reference to the parent notification definition',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'Notification definition ID is required' })
  @IsUUID('4', { message: 'Notification definition ID must be a valid UUID' })
  notificationDefinitionId: string;

  /**
   * Order index for sorting notification items within a definition
   * @example 1
   */
  @ApiProperty({
    description: 'Order index for sorting notification items within a definition',
    example: 1,
  })
  @IsNotEmpty({ message: 'Order index is required' })
  @IsNumber({}, { message: 'Order index must be a number' })
  orderIndex: number;

  /**
   * Type of notification (Email, SMS, Amplitude)
   * @example 'Email'
   */
  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: NotificationType.Email,
  })
  @IsNotEmpty({ message: 'Notification type is required' })
  @IsEnum(NotificationType, { message: 'Notification type must be a valid enum value' })
  notificationType: NotificationType;

  /**
   * Template string for the notification content
   * @example 'Hello <%= name %>, your payment is due on <%= dueDate %>'
   */
  @IsOptional()
  @IsString({ message: 'Template must be a string' })
  @ApiPropertyOptional({
    description: 'Template string for the notification content (supports EJS syntax)',
    example: 'Hello <%= name %>, your payment is due on <%= dueDate %>',
    required: false,
  })
  template?: string;

  /**
   * Header text for the notification (supports EJS templates)
   * @example 'Payment Reminder for <%= userName %>'
   */
  @IsOptional()
  @IsString({ message: 'Header must be a string' })
  @ApiPropertyOptional({
    description: 'Header text for the notification (supports EJS syntax)',
    example: 'Payment Reminder for <%= userName %>',
    required: false,
  })
  header?: string;

  /**
   * Body text for the notification (supports EJS templates)
   * @example 'Dear <%= userName %>, your payment of $<%= amount %> is due on <%= dueDate %>'
   */
  @IsOptional()
  @IsString({ message: 'Body must be a string' })
  @ApiPropertyOptional({
    description: 'Body text for the notification (supports EJS syntax)',
    example: 'Dear <%= userName %>, your payment of $<%= amount %> is due on <%= dueDate %>',
    required: false,
  })
  body?: string;

  /**
   * Target destination for the notification (supports EJS templates)
   * @example '<%= userEmail %>'
   */
  @IsOptional()
  @IsString({ message: 'Target must be a string' })
  @ApiPropertyOptional({
    description: 'Target destination for the notification (supports EJS syntax)',
    example: '<%= userEmail %>',
    required: false,
  })
  target?: string;

  /**
   * Additional metadata for the notification item (supports EJS templates in JSON string)
   * @example '{"userId": "<%= userId %>", "loanId": "<%= loanId %>", "amount": "<%= amount %>"}'
   */
  @IsOptional()
  @IsString({ message: 'Metadata must be a string' })
  @ApiPropertyOptional({
    description: 'Additional metadata for the notification item (supports EJS syntax in JSON string)',
    example: '{"userId": "<%= userId %>", "loanId": "<%= loanId %>", "amount": "<%= amount %>"}',
    required: false,
  })
  metadata?: string;

  /**
   * Any additional params for specific provider
   * @example '{"template": true}'
   */
  @ApiProperty({
    description: 'Any additional params for specific provider',
    example: '{"template": true}',
    required: false,
  })
  @IsOptional()
  @IsObject({ message: 'Metadata must be a object' })
  attributes?: object;
}
