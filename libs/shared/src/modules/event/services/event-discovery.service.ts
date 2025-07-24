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
      this.cache = this.getCash();
      this.logger.debug(`Initialize cash: ${this.cache.keys()}`);
    }

    if (!this.cache.has(name)) {
      this.logger.debug(`Event with name "${name}" was not found`);
      return undefined;
    }

    return this.cache.get(name);
  }

  private getCash(): Map<string, EventConstructor> {
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
          const eventClassName = this.getClassName(eventClass);
          map.set(eventClassName, eventClass);
        }

        return map;
      }, new Map<string, EventConstructor>());
  }

  private isConstructor(value: any): value is EventConstructor {
    return typeof value === 'function' &&
      value.prototype &&
      value.prototype.constructor === value;
  }

  private getClassName(constructor: EventConstructor): string | undefined {
    if (!this.isConstructor(constructor)) {
      return undefined;
    }

    if (constructor.name) {
      return constructor.name;
    }

    if (constructor.prototype && constructor.prototype.constructor && constructor.prototype.constructor.name) {
      return constructor.prototype.constructor.name;
    }

    return undefined;
  }
}
