import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for creating a new notification definition
 */
export class CreateNotificationDefinitionRequestDto {
  /**
   * Name of the notification definition
   * @example 'Payment Reminder'
   */
  @ApiProperty({
    description: 'Name of the notification definition',
    example: 'Payment Reminder',
  })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  name: string;
}
