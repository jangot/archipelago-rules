import { EVENTS_MODULE_CONFIG, IEventsModuleConfig } from '@library/shared/modules/events';
import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

@Injectable()
export class EventsConsumerService implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(EVENTS_MODULE_CONFIG) private readonly config: IEventsModuleConfig,
  ) {}

  public onModuleInit() {

  }

  public onModuleDestroy() {}
}
