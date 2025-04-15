import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for updating an existing notification definition
 */
export class UpdateNotificationDefinitionRequestDto {
  /**
   * Updated name for the notification definition
   * @example 'Updated Payment Reminder'
   */
  @ApiProperty({
    description: 'Updated name for the notification definition',
    example: 'Updated Payment Reminder',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  name?: string;
}
