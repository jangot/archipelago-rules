import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationDataItems } from '@library/entity/enum/notification-data-items';

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

  /**
   * Array of notification types that this definition supports
   */
  @IsArray()
  @IsEnum(NotificationDataItems, { each: true })
  dataItems: NotificationDataItems[];
}
