import { DynamicModule, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { EVENTS_MODULE_CONFIG } from './constants';
import { IEventsModuleOptions } from './interface';
import { CommandDiscoveryService } from './services/command-discovery.service';
import { EventsPublisherService } from './services/events-publisher.service';
import { SnsPublisherService } from './services/sns-publisher.service';

@Module({})
export class Events2Module {
  static forRootAsync(options: IEventsModuleOptions): DynamicModule {
    return {
      module: Events2Module,
      imports: [CqrsModule],
      providers: [
        {
          provide: EVENTS_MODULE_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject,
        },
        CommandDiscoveryService,
        SnsPublisherService,
        EventsPublisherService,
      ],
      exports: [EventsPublisherService],
      global: options.isGlobal ?? false,
    };
  }
}
