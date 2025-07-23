import { Injectable, Logger } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';

interface Event {
  eventClass: any;
  handlerClass: any;
}

// const EVENT_METADATA_KEY = '__commandHandler__';
const EVENT_METADATA_KEY = '__eventHandler__';

@Injectable()
export class CommandDiscoveryService {
  private logger = new Logger(CommandDiscoveryService.name);
  private readonly cache: Map<string, Event>;

  constructor(private readonly discoveryService: DiscoveryService) {
    this.cache = new Map();
  }

  // TODO finish the logic
  public findEventByName(name: string): Event | undefined {
    if (this.cache.has(name)) {
      this.logger.debug(`Event with name "${name}" was taken from cache`);
      return this.cache.get(name);
    }

    const providers = this.discoveryService.getProviders();

    for (const provider of providers) {
      if (provider.instance) {
        const handlerClass = provider.instance.constructor;

        const eventClass = Reflect.getMetadata(EVENT_METADATA_KEY, handlerClass);


        if (eventClass && eventClass === name) {
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
}
