import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class NotificationDefinitionExistsPipe implements PipeTransform<string, Promise<string>> {
  constructor(private readonly notificationService: NotificationService) {}

  public async transform(value: string): Promise<string> {
    const definition = await this.notificationService.getDefinitionById(value);
    if (!definition) {
      throw new NotFoundException(`Notification definition with ID ${value} does not exist`);
    }

    return value;
  }
}
