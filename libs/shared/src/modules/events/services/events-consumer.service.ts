import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Message } from '@aws-sdk/client-sqs';

import { EVENTS_MODULE_CONFIG } from '../constants';
import { EventsModuleSQSConfig, IEventsModuleConfig, SqsInstance } from '../interface';
import { SqsConsumerService } from './sqs-consumer.service';
import { EventsMapperService } from './events-mapper.service';

@Injectable()
export class EventsConsumerService implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger(EventsConsumerService.name);
  private sqsInstances: SqsInstance[];

  constructor(
    @Inject(EVENTS_MODULE_CONFIG) private readonly config: IEventsModuleConfig,
    private readonly eventBus: EventBus,
    private readonly eventsMapper: EventsMapperService,
    private readonly sqsConsumerService: SqsConsumerService,
  ) {}

  public onModuleInit() {
    this.sqsInstances = [this.config.sqs]
      .filter((it) => !!it)
      .map((cfg) => this.initInstance(cfg));
  }

  public onModuleDestroy() {
    this.sqsInstances.forEach((instance) => instance.finish());
  }

  private initInstance(cfg: EventsModuleSQSConfig) {
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
