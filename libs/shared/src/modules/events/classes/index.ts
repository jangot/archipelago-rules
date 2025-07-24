import { IZirtueEvent } from '../interface';

export class ZirtueEventBase<T> implements IZirtueEvent<T> {
  type: string;

  constructor(public readonly payload: T) {}
}

export class ZirtueDistributedEvent<T> extends ZirtueEventBase<T> {
  type = ZirtueDistributedEvent.name;
}

export class ZirtueEvent<T> extends ZirtueEventBase<T> {
  type = ZirtueEvent.name;
}
