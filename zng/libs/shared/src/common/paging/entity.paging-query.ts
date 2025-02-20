import { FindOptionsOrder, ObjectLiteral } from 'typeorm';
import { IPagingOptions } from './paging.options.interface';
import { DEFAULT_PAGING_LIMIT, DEFAULT_PAGING_ORDER, DEFAULT_PAGING_ORDER_BY } from './paging.order.constants';

export interface IPagingQuery<Entity extends ObjectLiteral> {
  skip: number;
  take: number;
  order: FindOptionsOrder<Entity>;
}

export function buildPagingQuery<Entity extends ObjectLiteral>(paging?: IPagingOptions): IPagingQuery<Entity> {
  // Build default paging query first to avoid any zeroed values from input
  const pagingQuery: IPagingQuery<Entity> = {
    order: { [DEFAULT_PAGING_ORDER_BY.toString()]: DEFAULT_PAGING_ORDER.toString() } as FindOptionsOrder<Entity>,
    skip: 0,
    take: DEFAULT_PAGING_LIMIT,
  };

  // Override default paging query with input paging options
  if (paging) {
    const { offset, limit, order, orderBy } = paging;
    if (offset) pagingQuery.skip = offset;
    if (limit) pagingQuery.take = limit;
    if (order && orderBy && typeof paging.orderBy === 'string')
      pagingQuery.order = { [orderBy]: order } as FindOptionsOrder<Entity>;
  }
  return pagingQuery;
}
