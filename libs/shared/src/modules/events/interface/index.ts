import { IEvent } from '@nestjs/cqrs';

export * from './ievents-module-options';
export * from './ievents-module-config';
export * from './ievents-publisher';
export * from './isns-notification';
export * from './isqs-concumer-instance';

export interface ICoreEvent<T> extends IEvent {
  type: string;
  payload: T;
}
