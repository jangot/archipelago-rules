import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { NotificationDomainService } from '@notification/domain/services/notification.definition.service';

/**
 * Pipe to validate that notification definition name is unique
 */
@Injectable()
export class UniqueNotificationDefinitionNamePipe implements PipeTransform {
  constructor(private readonly notificationDomainService: NotificationDomainService) {}

  async transform(value: any): Promise<any> {
    // Only validate if value has a name property (POST/PUT requests with body)
    // and only for notification definitions, not notification definition items
    if (value && typeof value === 'object' && value.name && !value.notificationDefinitionId) {
      const existingDefinition = await this.notificationDomainService.findByName(value.name);
      if (existingDefinition) {
        throw new BadRequestException(`Notification definition with name '${value.name}' already exists`);
      }
    }
    return value;
  }
}