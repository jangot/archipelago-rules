import { NotificationDataItems } from '@library/entity/enum/notification-data-items';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { ContainsRequiredValues } from '@library/shared';

/**
 * DTO for updating an existing notification definition
 */
export class UpdateNotificationDefinitionRequestDto {
  /**
   * Updated name for the notification definition
   * @example 'payment_reminder'
   */
  @ApiProperty({
    description: 'Updated name for the notification definition',
    example: 'payment_reminder',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  name?: string;

  /**
   * Array of notification types that this definition supports
   * Must always contain 'user' when provided
   */
  @ApiProperty({
    description: 'Array of notification types that this definition supports. Must always contain user.',
    example: [NotificationDataItems.User, NotificationDataItems.LenderLoan],
    required: false,
    isArray: true,
    enum: NotificationDataItems,
  })
  @IsArray()
  @IsOptional()
  @IsEnum(NotificationDataItems, { each: true })
  @ContainsRequiredValues([NotificationDataItems.User], { message: 'dataItems must always contain user' })
  dataItems?: NotificationDataItems[];
}
