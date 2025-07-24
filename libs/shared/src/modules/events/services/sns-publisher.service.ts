import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

import { EVENTS_MODULE_CONFIG } from '@library/shared/modules/events/constants';
import { IEventsModuleConfig, IEventsPublisher } from '@library/shared/modules/events/interface';
import { CorePublishedEvent } from '@library/shared/modules/events/classes';

@Injectable()
export class SnsPublisherService implements OnModuleInit, IEventsPublisher {
  private logger = new Logger(SnsPublisherService.name);

  private serviceName: string;
  private client?: SNSClient;
  private topicArn?: string;

  constructor(
    @Inject(EVENTS_MODULE_CONFIG) private readonly config: IEventsModuleConfig,
  ) {}

  onModuleInit() {
    this.serviceName = this.config.serviceName;
    if (this.config.sns) {
      this.topicArn = this.config.sns.topicArn;
      this.client = new SNSClient(this.config.sns.clientConfig);
    }
  }

  async publish<T extends CorePublishedEvent<any>>(command: T): Promise<void> {
    if (!this.client) {
      return;
    }

    const Message = JSON.stringify(command.payload);
    const publishCommand = new PublishCommand({
      TopicArn: this.topicArn,
      Message,
      MessageAttributes: {
        eventType: {
          DataType: 'String',
          StringValue: command.constructor.name,
        },
        sourceService: {
          DataType: 'String',
          StringValue: this.serviceName,
        },
      },
    });

    await this.client.send(publishCommand);

    this.logger.debug(`${command.constructor.name} was published: ${Message}`);
  }
}
