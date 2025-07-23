import { DynamicModule, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { EVENTS_MODULE_CONFIG } from './constants';
import { EventsModuleOptions } from './interface';
import { EventsPublisherService } from './services/events-publisher.service';
import { SnsPublisherService } from '@library/shared/modules/events2/services/sns-publisher.service';
import { CommandDiscoveryService } from '@library/shared/modules/events2/services/command-discovery.service';

@Module({})
export class Events2Module {
  static forRootAsync(options: EventsModuleOptions): DynamicModule {
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
    };
  }
}
