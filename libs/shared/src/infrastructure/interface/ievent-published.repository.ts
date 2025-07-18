import { IEventPublished } from '@library/entity/entity-interface';
import { IRepositoryBase } from '@library/shared/common/data/ibase.repository';


// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IEventPublishedRepository extends IRepositoryBase<IEventPublished> {
}

export const IEventPublishedRepository = Symbol('IEventPublishedRepository'); 
