import { ICoreEvent } from './index';

export interface IEventsPublisher {
  publish<T extends  ICoreEvent<any>>(event: T): Promise<void>;
}
