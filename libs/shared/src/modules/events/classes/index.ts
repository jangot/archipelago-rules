import { ICoreEvent } from '../interface';

export class CoreAbstractEvent<T> implements ICoreEvent<T> {
  type: string;

  constructor(public readonly payload: T) {}
}

export class CorePublishedEvent<T> extends CoreAbstractEvent<T> {
  type = 'CorePublishedEvent';
}

export class CoreLocalEvent<T> extends CoreAbstractEvent<T> {
  type = 'CoreLocalEvent';
}

export class CoreExternalEvent<T> extends CoreAbstractEvent<T> {
  type = 'CoreExternalEvent';
}
