import { IZirtueEvent } from '../interface';

export class ZirtueBaseEvent<T> implements IZirtueEvent<T> {
  type: string;

  constructor(public readonly payload: T) {}
}

export class ZirtueDistributedEvent<T> extends ZirtueBaseEvent<T> {
  type = ZirtueDistributedEvent.name;
}

export class ZirtueEvent<T> extends ZirtueBaseEvent<T> {
  type = ZirtueEvent.name;
}
