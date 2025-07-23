import { EventsModuleConfig } from './events-module-config';

export interface EventsModuleOptions {
  useFactory: (...args: any[]) => EventsModuleConfig;
  inject: any[];
}
