import { NotificationEvent, NotificationEventPayload } from '@library/shared/events/notification.event';
import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler } from '@nestjs/cqrs';
import { template } from 'lodash';

import { NotificationService } from '@notification/services/notification.service';
import { NotificationProviderFactory } from '@notification/providers/notification-provider-factory';
import { NotificationDefinition, NotificationDefinitionItem } from '@notification/domain/entity';
import { INotificationMessageRequest } from '@notification/interfaces/inotification-message';

@Injectable()
@EventsHandler(NotificationEvent)
export class NotificationHandler {
  private readonly logger: Logger = new Logger(NotificationHandler.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly providersFactory: NotificationProviderFactory,
  ) {}

  async handle(event: NotificationEvent): Promise<void> {
    const definition = await this.notificationService.findByNameWithItems(event.payload.name);
    if (!definition) {
      this.logger.warn(`Definition was not found: ${event.payload.name}`);
      return;
    }

    if (!this.payloadHasAllData(definition, event.payload)) {
      this.logger.error(`Data is not enough for the notification: ${event.payload.name}`);
      return;
    }

    for (const item of definition.items) {
      const provider = this.providersFactory.getProvider(item.notificationType);
      const message = this.createMessageByDefinitionItem(item, event.payload);

      await provider.sendMessage(message);
    }

    this.logger.debug(definition);
    // Get templates by event.name
    // render templates
    // send notification
  }

  private payloadHasAllData(definition: NotificationDefinition, payload: NotificationEventPayload): boolean {
    const payloadKeys = Object.keys(payload);
    return definition.dataItems.every((val) => payloadKeys.includes(val));
  }

  private createMessageByDefinitionItem(definition: NotificationDefinitionItem, payload: NotificationEventPayload): INotificationMessageRequest {
    const message = template(definition.template)(payload);
    const metadata = definition.metadata ? template(definition.metadata)(payload) : '';
    const header = definition.header ? template(definition.header)(payload) : '';
    const body = definition.body ? template(definition.body)(payload) : '';

    return {
      user: payload.user,
      metadata,
      header,
      body,
      message,
    };
  }
}
