import { IZirtueEvent } from './index';

export interface IEventsPublisher {
  publish<T extends  IZirtueEvent<any>>(event: T): Promise<void>;
}
