import { ICoreEvent } from '@library/shared/modules/events2/interface/index';

export interface IEventsPublisher {
  publish<T extends  ICoreEvent<any>>(event: T): Promise<void>;
}
