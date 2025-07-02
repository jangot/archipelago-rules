import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for notification definition responses
 */
export class NotificationDefinitionResponseDto {
  /**
   * Unique identifier of the notification definition
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  @ApiProperty({
    description: 'Unique identifier of the notification definition',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  /**
   * Name of the notification definition
   * @example 'Payment Reminder'
   */
  @ApiProperty({
    description: 'Name of the notification definition',
    example: 'Payment Reminder',
  })
  name: string;

  /**
   * Timestamp when the notification definition was created
   * @example '2025-04-11T14:30:00Z'
   */
  @ApiProperty({
    description: 'Timestamp when the notification definition was created',
    example: '2025-04-11T14:30:00Z',
  })
  createdAt: Date;

  /**
   * Timestamp when the notification definition was last updated
   * @example '2025-04-11T15:45:00Z'
   */
  @ApiProperty({
    description: 'Timestamp when the notification definition was last updated',
    example: '2025-04-11T15:45:00Z',
  })
  updatedAt: Date;
}
