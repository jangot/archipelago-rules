import { Injectable, Logger } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { EVENTS_HANDLER_METADATA } from '@nestjs/cqrs/dist/decorators/constants';

type EventConstructor = new (...args: any[]) => any;

@Injectable()
export class EventDiscoveryService {
  private logger = new Logger(EventDiscoveryService.name);
  private cache: Map<string, EventConstructor>;

  constructor(private readonly discoveryService: DiscoveryService) {}

  public findEventByName(name: string): EventConstructor | undefined {
    if (!this.cache) {
      this.cache = this.getCachedEventHandlers();
      this.logger.debug(`Initialize cache: ${[...this.cache.keys()]}`);
    }

    const result = this.cache.get(name);
    if (!result) {
      this.logger.log(`Event with name "${name}" was not found`);
    }

    return result;
  }

  private getCachedEventHandlers(): Map<string, EventConstructor> {
    return this.discoveryService.getProviders()
      .filter((provider) => !!provider.instance)
      .map((provider) => {
        const handlerClass = provider.instance.constructor;

        return Reflect.getMetadata(EVENTS_HANDLER_METADATA, handlerClass);
      })
      .reduce((map, eventHandlerMetadata) => {
        const eventClass = Array.isArray(eventHandlerMetadata)
          ? eventHandlerMetadata[0]
          : eventHandlerMetadata;

        if (this.isConstructor(eventClass)) {
          map.set(eventClass.name, eventClass);
        }

        return map;
      }, new Map<string, EventConstructor>());
  }

  private isConstructor(value: unknown): value is EventConstructor {
    return (
      typeof value === 'function' &&
      /^class\s/.test(Function.prototype.toString.call(value))
    );
  }
}
