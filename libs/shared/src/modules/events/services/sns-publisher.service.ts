import { SNSClient } from '@aws-sdk/client-sns';
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { ZirtueDistributedEvent } from '@library/shared/modules/events/classes';
import { ZIRTUE_EVENTS_MODULE_CONFIG } from '@library/shared/modules/events/constants';
import { IEventsModuleConfig, IEventsPublisher } from '@library/shared/modules/events/interface';
import { EventsMapperService } from '@library/shared/modules/events/services/events-mapper.service';

@Injectable()
export class SnsPublisherService implements OnModuleInit, OnModuleDestroy, IEventsPublisher {
  private logger = new Logger(SnsPublisherService.name);

  private client?: SNSClient;
  private topicArn?: string;

  constructor(
    @Inject(ZIRTUE_EVENTS_MODULE_CONFIG) private readonly config: IEventsModuleConfig,
    private readonly eventsMapper: EventsMapperService
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

  public async publish<T extends ZirtueDistributedEvent<any>>(command: T): Promise<void> {
    if (!this.client || !this.topicArn) {
      return;
    }

    const publishCommand = this.eventsMapper.cqrsEventToSnsCommand(command, this.topicArn);

    await this.client.send(publishCommand);

    this.logger.debug(`${command.constructor.name} was published`);
  }
}
