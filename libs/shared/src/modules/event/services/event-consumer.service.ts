import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Message } from '@aws-sdk/client-sqs';

import { ZIRTUE_EVENT_MODULE_CONFIG } from '../constants';
import { EventModuleSQSConfig, IEventModuleConfig, SqsInstance } from '../interface';
import { EventSqsConsumerService } from './event-sqs-consumer.service';
import { EventMapperService } from './event-mapper.service';

@Injectable()
export class EventConsumerService implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger(EventConsumerService.name);
  private sqsInstances: SqsInstance[];

  constructor(
    @Inject(ZIRTUE_EVENT_MODULE_CONFIG) private readonly config: IEventModuleConfig,
    private readonly eventBus: EventBus,
    private readonly eventsMapper: EventMapperService,
    private readonly sqsConsumerService: EventSqsConsumerService,
  ) {}

  public onModuleInit() {
    this.sqsInstances = [this.config.sqs]
      .filter((it) => !!it)
      .map((cfg) => this.initInstance(cfg));
  }

  public onModuleDestroy() {
    this.sqsInstances.forEach((instance) => instance.finish());
  }

  private initInstance(cfg: EventModuleSQSConfig) {
    const instance = this.sqsConsumerService.getInstance(cfg);

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
