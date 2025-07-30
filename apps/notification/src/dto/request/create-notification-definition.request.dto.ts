import { NotificationDataItems } from '@library/entity/enum/notification-data-items';
import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ContainsRequiredValues } from '@library/shared';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for creating a notification definition
 */
export class CreateNotificationDefinitionRequestDto {
  /**
   * Name of the notification definition
   */
  @ApiProperty({
    description: 'Name of the notification definition',
    example: 'payment_reminder',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * Array of notification types that this definition supports
   * Must always contain 'user' when provided
   */
  @ApiProperty({
    description: 'Array of notification types that this definition supports. Must always contain user.',
    example: [NotificationDataItems.User, NotificationDataItems.Loan],
    required: false,
    isArray: true,
    enum: NotificationDataItems,
  })
  @IsArray()
  @IsEnum(NotificationDataItems, { each: true })
  @ContainsRequiredValues([NotificationDataItems.User], { message: 'dataItems must always contain user' })
  dataItems: NotificationDataItems[];
}
