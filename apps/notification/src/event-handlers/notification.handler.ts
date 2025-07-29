import { NotificationEvent, NotificationEventPayload } from '@library/shared/events/notification.event';
import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { template } from 'lodash';

import { IDomainServices } from '@notification/domain/domain.iservices';
import { NotificationDefinition, NotificationDefinitionItem } from '@notification/domain/entity';
import { INotificationMessageRequest, INotificationMessageResult } from '@notification/interfaces/inotification-message';
import { NotificationProviderFactory } from '@notification/providers/notification-provider-factory';
import { NotificationService } from '@notification/services/notification.service';

@Injectable()
@EventsHandler(NotificationEvent)
export class NotificationHandler implements IEventHandler<NotificationEvent> {
  private readonly logger: Logger = new Logger(NotificationHandler.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly providersFactory: NotificationProviderFactory,
    private readonly domainServices: IDomainServices,
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
      try {
        const provider = this.providersFactory.getProvider(item.notificationType);
        const message = this.createMessageByDefinitionItem(item, event.payload);

        const result = await provider.sendMessage(message);

        await this.domainServices.notificationLogServices.logNotificationResult(result);

        this.logger.debug(`Notification sent successfully to ${result.target} via ${result.transport}`);
      } catch (error) {
        this.logger.error(`Failed to send notification via ${item.notificationType}: ${error.message}`);
      }
    }
  }

  private payloadHasAllData(definition: NotificationDefinition, payload: NotificationEventPayload): boolean {
    const payloadKeys = Object.keys(payload);
    return definition.dataItems.every((val) => payloadKeys.includes(val));
  }

  private createMessageByDefinitionItem(definition: NotificationDefinitionItem, payload: NotificationEventPayload): INotificationMessageRequest {
    const message = definition.template ? template(definition.template)(payload) : '';
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
