import { DynamicModule, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';

import { ZIRTUE_EVENT_MODULE_CONFIG } from './constants';
import { EventMapperService } from './services/event-mapper.service';
import { IEventModuleOptions } from './interface';
import { EventDiscoveryService } from './services/event-discovery.service';
import { EventPublisherService } from './services/event-publisher.service';
import { EventSnsPublisherService } from './services/event-sns-publisher.service';
import { EventSqsConsumerService } from '@library/shared/modules/event/services/event-sqs-consumer.service';
import { EventConsumerService } from '@library/shared/modules/event/services/event-consumer.service';

@Module({})
export class EventModule {
  static forRootAsync(options: IEventModuleOptions): DynamicModule {
    return {
      module: EventModule,
      global: options.isGlobal ?? false,
      imports: [CqrsModule, DiscoveryModule],
      providers: [
        {
          provide: ZIRTUE_EVENT_MODULE_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject,
        },
        EventDiscoveryService,
        EventMapperService,
        EventSnsPublisherService,
        EventPublisherService,
        EventSqsConsumerService,
        EventConsumerService,
      ],
      exports: [EventPublisherService],
    };
  }
}
