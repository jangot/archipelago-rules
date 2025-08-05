import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import { NotificationDefinitionItemService } from '../services/notification-definition-item.service';

@Injectable()
export class NotificationDefinitionItemExistsPipe implements PipeTransform {
  constructor(private readonly notificationDefinitionItemService: NotificationDefinitionItemService) {}

  public async transform(value: string): Promise<string> {
    const item = await this.notificationDefinitionItemService.getItemById(value);
    if (!item) {
      throw new NotFoundException(`Notification definition item with ID ${value} does not exist`);
    }

    return value;
  }
}