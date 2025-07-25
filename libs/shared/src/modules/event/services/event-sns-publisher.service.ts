import { SNSClient } from '@aws-sdk/client-sns';
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { ZirtueDistributedEvent } from '@library/shared/modules/event/classes';
import { ZIRTUE_EVENT_MODULE_CONFIG } from '@library/shared/modules/event/constants';
import { IEventModuleConfig } from '@library/shared/modules/event/interface';
import { EventMapperService } from '@library/shared/modules/event/services/event-mapper.service';

@Injectable()
export class EventSnsPublisherService implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger(EventSnsPublisherService.name);

  private client?: SNSClient;
  private topicArn?: string;

  constructor(
    @Inject(ZIRTUE_EVENT_MODULE_CONFIG) private readonly config: IEventModuleConfig,
    private readonly eventsMapper: EventMapperService
  ) {}

  public onModuleInit() {
    if (this.config.sns) {
      this.topicArn = this.config.sns.topicArn;
      this.client = new SNSClient(this.config.sns.clientConfig);
    }
  }

  public onModuleDestroy() {
    if (this.client) {
      this.client.destroy();
    }
  }

  public async publish<T extends ZirtueDistributedEvent<any>>(event: T) {
    if (!this.client || !this.topicArn) {
      this.logger.warn(`${event.constructor.name} was not published: SQS was not configured`);
      return;
    }

    const publishCommand = this.eventsMapper.cqrsEventToSnsCommand(event, this.topicArn);
    await this.client.send(publishCommand);

    this.logger.debug(`${event.constructor.name} was published`);
  }
}
