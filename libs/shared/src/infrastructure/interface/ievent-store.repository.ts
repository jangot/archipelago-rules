import { IEventStore } from '@library/entity/entity-interface';
import { IRepositoryBase } from '@library/shared/common/data';

export interface IEventStoreRepository extends IRepositoryBase<IEventStore> {
  getEventsByEventName(eventName: string): Promise<IEventStore[]>;
}

export const IEventStoreRepository = Symbol('IEventStoreRepository');
