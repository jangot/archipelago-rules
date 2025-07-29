import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { NotificationDataItems } from '@library/entity/enum/notification-data-items';

/**
 * DTO for creating a notification definition
 */
export class CreateNotificationDefinitionRequestDto {
  /**
   * Name of the notification definition
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * Array of notification types that this definition supports
   */
  @IsArray()
  @IsEnum(NotificationDataItems, { each: true })
  dataItems: NotificationDataItems[];
}
