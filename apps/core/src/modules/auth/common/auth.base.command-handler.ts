import { NotificationEvent } from '@library/shared/events/notification.event';
import { EventPublisherService } from '@library/shared/modules/event';
import { NotificationNameType } from '@library/shared/notifications/notification.names';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IDomainServices } from '../../domain/idomain.services';

@Injectable()
export abstract class AuthBaseCommandHandler {

  constructor(
    protected readonly domainServices: IDomainServices,
    protected readonly publisherService: EventPublisherService,
    protected readonly config: ConfigService
  ) {}

  protected isDevelopmentEnvironment(): boolean {
    const env = this.config.get<string>('NODE_ENV', 'production');
    return env === 'development' || env === 'local';
  }

  protected async sendCode(notificationName: NotificationNameType, userId: string, code: string): Promise<void> {
    const payload = await this.domainServices.notificationServices.getNotificationPayload(notificationName, userId, { code });
    if (!payload) {
      return;
    }

    await this.publisherService.publish(new NotificationEvent(payload));
  }
}
