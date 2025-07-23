import { Injectable, Logger } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { EVENTS_HANDLER_METADATA } from '@nestjs/cqrs/dist/decorators/constants';

type EventConstructor = new (...args: any[]) => any;

@Injectable()
export class CommandDiscoveryService {
  private logger = new Logger(CommandDiscoveryService.name);
  private readonly cache: Map<string, EventConstructor>;

  constructor(private readonly discoveryService: DiscoveryService) {
    this.cache = new Map();
  }

  /**
   * Finds event class by class name
   * @param name - event class name
   * @returns Event class constructor or undefined
   */
  public findEventByName(name: string): EventConstructor | undefined {
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

          // Validate that eventClass is actually a constructor function
          if (!this.isConstructor(eventClass)) {
            this.logger.warn(`Invalid event class found in metadata for handler ${handlerClass.name}: not a constructor`);
            continue;
          }

          // Extract event class name safely
          const eventClassName = this.getClassName(eventClass);

          // Compare event class name with searched name
          if (eventClassName === name) {
            this.logger.debug(`Event with name "${name}" was found`);

            this.cache.set(name, eventClass);
            return eventClass;
          }
        }
      }
    }

    this.logger.debug(`Event with name "${name}" was not found`);
    return undefined;
  }

  /**
   * Validates if the provided value is a constructor function
   * @param value - value to check
   * @returns true if value is a constructor function
   */
  private isConstructor(value: any): value is EventConstructor {
    return typeof value === 'function' &&
           value.prototype &&
           value.prototype.constructor === value;
  }

  /**
   * Safely extracts class name from constructor function
   * @param constructor - constructor function
   * @returns class name or undefined
   */
  private getClassName(constructor: EventConstructor): string | undefined {
    if (!this.isConstructor(constructor)) {
      return undefined;
    }

    // Try to get name from constructor
    if (constructor.name) {
      return constructor.name;
    }

    // Fallback: try to get name from prototype
    if (constructor.prototype && constructor.prototype.constructor && constructor.prototype.constructor.name) {
      return constructor.prototype.constructor.name;
    }

    return undefined;
  }
}
