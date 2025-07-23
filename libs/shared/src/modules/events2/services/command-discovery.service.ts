import { Injectable, Logger } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { EVENTS_HANDLER_METADATA } from '@nestjs/cqrs/dist/decorators/constants';

interface Event {
  eventClass: any;
  handlerClass: any;
}

@Injectable()
export class CommandDiscoveryService {
  private logger = new Logger(CommandDiscoveryService.name);
  private readonly cache: Map<string, Event>;

  constructor(private readonly discoveryService: DiscoveryService) {
    this.cache = new Map();
  }

  /**
   * Finds event by class name
   * @param name - event class name
   * @returns Event with eventClass and handlerClass or undefined
   */
  public findEventByName(name: string): Event | undefined {
    if (this.cache.has(name)) {
      this.logger.debug(`Event with name "${name}" was taken from cache`);
      return this.cache.get(name);
    }

    const providers = this.discoveryService.getProviders();

    for (const provider of providers) {
      if (provider.instance) {
        const handlerClass = provider.instance.constructor;

        // Get event handler metadata
        const eventHandlerMetadata = Reflect.getMetadata(EVENTS_HANDLER_METADATA, handlerClass);

        if (eventHandlerMetadata) {
          // Extract event class from metadata (metadata can be an array)
          const eventClass = Array.isArray(eventHandlerMetadata)
            ? eventHandlerMetadata[0]
            : eventHandlerMetadata;

          // Extract event class name
          const eventClassName = eventClass.name || eventClass.constructor?.name;

          // Compare event class name with searched name
          if (eventClassName === name) {
            this.logger.debug(`Event with name "${name}" was found`);

            const result = {
              eventClass,
              handlerClass,
            };

            this.cache.set(name, result);
            return result;
          }
        }
      }
    }

    this.logger.debug(`Event with name "${name}" was not found`);
    return undefined;
  }
}
