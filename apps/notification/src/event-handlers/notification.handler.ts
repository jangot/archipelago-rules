import { NotificationEvent, NotificationEventPayload } from '@library/shared/events/notification.event';
import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { template } from 'lodash';

import { NotificationDefinition, NotificationDefinitionItem } from '@library/shared/domain/entity';
import { IDomainServices } from '@notification/domain/domain.iservices';
import {
  INotificationMessageRequest,
  INotificationMessageResult,
} from '@notification/interfaces/inotification-message';
import { NotificationProviderFactory } from '@notification/providers/notification-provider-factory';
import { NotificationDataItems } from '@library/entity/enum/notification-data-items';

class NotificationUnexpectedFailResult implements INotificationMessageResult {
  target = 'unknown';
  transport = 'unknown';
  metadata = '';
  header = '';
  body = '';
  message = '';

  constructor(
    public userId: string,
    public definitionItemId: string,
    public status: string,
  ) {}
}

class TemplateRenderError extends Error {}

@Injectable()
@EventsHandler(NotificationEvent)
export class NotificationHandler implements IEventHandler<NotificationEvent> {
  private readonly logger: Logger = new Logger(NotificationHandler.name);

  constructor(
    private readonly providersFactory: NotificationProviderFactory,
    private readonly domainServices: IDomainServices,
  ) {}

  async handle(event: NotificationEvent): Promise<void> {
    const definition = await this.domainServices.notificationServices.findByNameWithItems(event.payload.name);
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
        const result = await provider.send(message);

        await this.domainServices.notificationLogServices.logNotificationResult(result);

        this.logger.debug(`Notification sent successfully to ${result.target} via ${result.transport}`);
      } catch (error) {
        const status = error instanceof TemplateRenderError ? 'render_error' : 'unexpected_error';

        await this.domainServices.notificationLogServices.logNotificationResult(
          new NotificationUnexpectedFailResult(event.payload[NotificationDataItems.User].id, item.id, status)
        );
        this.logger.error(`Failed to send notification via ${item.notificationType}: ${error.message}`, error);
      }
    }
  }

  private payloadHasAllData(definition: NotificationDefinition, payload: NotificationEventPayload): boolean {
    const payloadKeys = Object.keys(payload);

    return definition.dataItems.every((val) => payloadKeys.includes(val));
  }

  private createMessageByDefinitionItem(definition: NotificationDefinitionItem, payload: NotificationEventPayload): INotificationMessageRequest {
    try {
      const templateParams = {
        ...payload,
        ...payload.params,
      };
      return {
        user: payload.user,
        metadata: definition.metadata ? template(definition.metadata)(templateParams) : '',
        header: definition.header ? template(definition.header)(templateParams) : '',
        body: definition.body ? template(definition.body)(templateParams) : '',
        message: definition.template ? template(definition.template)(templateParams) : '',
        attributes: definition.attributes,
        definitionItemId: definition.id,
      };
    } catch (error) {
      this.logger.error({ info: `Notification render error for user: ${payload.user.id}`, error });
      throw new TemplateRenderError(error.message);
    }
  }
}
