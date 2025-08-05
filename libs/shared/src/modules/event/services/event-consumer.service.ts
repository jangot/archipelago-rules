import { Inject, Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Message, SQSClientConfig } from '@aws-sdk/client-sqs';

import { ZIRTUE_EVENT_MODULE_CONFIG } from '../constants';
import { EventModuleSQSQueueOptions, IEventModuleConfig, SqsInstance } from '../interface';
import { EventSqsConsumerService } from './event-sqs-consumer.service';
import { EventMapperService } from './event-mapper.service';

@Injectable()
export class EventConsumerService implements OnModuleInit, OnApplicationShutdown {
  private logger = new Logger(EventConsumerService.name);
  private sqsInstances: SqsInstance[] = [];

  constructor(
    @Inject(ZIRTUE_EVENT_MODULE_CONFIG) private readonly config: IEventModuleConfig,
    private readonly eventBus: EventBus,
    private readonly eventsMapper: EventMapperService,
    private readonly sqsConsumerService: EventSqsConsumerService,
  ) {}

  public onModuleInit() {
    const sqsConfig = this.config.sqs;

    if (sqsConfig) {
      this.sqsInstances = sqsConfig.queues
        .map((options: EventModuleSQSQueueOptions) => {
          return this.initInstance(sqsConfig.clientConfig, options);
        });
    }
  }

  public async onApplicationShutdown(signal: string) {
    this.logger.log(`Shutting down consumers due to signal: ${signal}`);
    await Promise.all(this.sqsInstances.map((instance) => instance.finish()));
    this.logger.log('All SQS consumers have been stopped');
  }

  private initInstance(config: SQSClientConfig, options: EventModuleSQSQueueOptions) {
    const instance = this.sqsConsumerService.getInstance(config, options);

    void instance.start(async (event: Message) => {
      const cqrsEvent = this.eventsMapper.sqsMessageToCqrsEvent(event);
      if (cqrsEvent) {
        this.eventBus.publish(cqrsEvent);
      } else {
        this.logger.warn({ info: 'Event is not correct', event });
      }
    });

    return instance;
  }
}
