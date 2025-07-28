import { NotificationEvent } from '@library/shared/events/notification.event';
import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler } from '@nestjs/cqrs';

import { NotificationService } from '@notification/services/notification.service';

@Injectable()
@EventsHandler(NotificationEvent)
export class NotificationHandler {
  private readonly logger: Logger = new Logger(NotificationHandler.name);

  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  async handle(event: NotificationEvent): Promise<void> {
    const definition = await this.notificationService.findByNameWithItems(event.payload.name);
    if (!definition) {
      this.logger.warn(`Definition was not found: ${event.payload.name}`);
      return;
    }

    this.logger.debug(definition);
    // Get templates by event.name
    // render templates
    // send notification
  }
}
