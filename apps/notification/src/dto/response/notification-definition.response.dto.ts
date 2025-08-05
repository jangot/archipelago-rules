import { NotificationDataItems } from '@library/entity/enum/notification-data-items';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * DTO for notification definition response
 */
export class NotificationDefinitionResponseDto {
  /**
   * Unique identifier for the notification definition
   */
  @Expose()
  @ApiProperty({
    description: 'Unique identifier for the notification definition',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  /**
   * Name of the notification definition
   */
  @Expose()
  @ApiProperty({
    description: 'Name of the notification definition',
    example: 'Payment Reminder',
  })
  name: string;

  /**
   * Array of notification types that this definition supports
   */
  @Expose()
  @ApiProperty({
    description: 'Array of notification types that this definition supports',
    example: ['user', 'loan'],
    isArray: true,
  })
  dataItems: NotificationDataItems[];

  /**
   * Timestamp when this notification definition was created
   */
  @Expose()
  @ApiProperty({
    description: 'Timestamp when this notification definition was created',
    example: '2025-04-11T14:30:00Z',
  })
  createdAt: Date;

  /**
   * Timestamp when this notification definition was last updated
   */
  @Expose()
  @ApiProperty({
    description: 'Timestamp when this notification definition was last updated',
    example: '2025-04-11T15:45:00Z',
  })
  updatedAt: Date;
}
