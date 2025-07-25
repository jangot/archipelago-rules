import { IEventModuleConfig } from './ievent-module-config';

export interface IEventModuleOptions {
  useFactory: (...args: any[]) => IEventModuleConfig;
  inject: any[];
  isGlobal?: boolean;
}
