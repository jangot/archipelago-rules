import { IEvent } from '@nestjs/cqrs';

export * from './events-module-options';
export * from './events-module-config';
export * from './events-consumer';
export * from './i-events-publisher';

export interface ICoreEvent<T> extends IEvent {
  type: string;
  payload: T;
}
