import { IEvent } from '@nestjs/cqrs';

export * from './ievent-module-config';
export * from './ievent-module-options';
export * from './isns-notification';
export * from './isqs-concumer-instance';

export interface IZirtueEvent<T> extends IEvent {
  type: string;
  payload: T;
}
