import { IZirtueEvent } from '../interface';

export class ZirtueEventBase<T> implements IZirtueEvent<T> {
  type: string;

  constructor(public readonly payload: T) {}
}

export class ZirtueDistributedEvent<T> extends ZirtueEventBase<T> {
  static type = 'ZirtueDistributedEvent';

  type = ZirtueDistributedEvent.type;
}

export class ZirtueEvent<T> extends ZirtueEventBase<T> {
  static type = 'ZirtueEvent';

  type = ZirtueEvent.type;
}
