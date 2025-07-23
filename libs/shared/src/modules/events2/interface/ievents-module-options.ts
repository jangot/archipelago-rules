import { IEventsModuleConfig } from './ievents-module-config';

export interface IEventsModuleOptions {
  useFactory: (...args: any[]) => IEventsModuleConfig;
  inject: any[];
  isGlobal?: boolean;
}
