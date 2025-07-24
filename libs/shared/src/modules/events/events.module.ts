import { DynamicModule, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';

import { EVENTS_MODULE_CONFIG } from './constants';
import { EventsMapperService } from './services/events-mapper.service';
import { IEventsModuleOptions } from './interface';
import { EventsDiscoveryService } from './services/events-discovery.service';
import { EventsPublisherService } from './services/events-publisher.service';
import { SnsPublisherService } from './services/sns-publisher.service';
import { SqsConsumerService } from '@library/shared/modules/events/services/sqs-consumer.service';
import { EventsConsumerService } from '@library/shared/modules/events/services/events-consumer.service';

@Module({})
export class EventsModule {
  static forRootAsync(options: IEventsModuleOptions): DynamicModule {
    return {
      module: EventsModule,
      global: options.isGlobal ?? false,
      imports: [CqrsModule, DiscoveryModule],
      providers: [
        {
          provide: EVENTS_MODULE_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject,
        },
        EventsDiscoveryService,
        EventsMapperService,
        SnsPublisherService,
        EventsPublisherService,
        SqsConsumerService,
        EventsConsumerService,
      ],
      exports: [EventsPublisherService],
    };
  }
}
