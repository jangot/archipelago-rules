/*
 * File Name   : paging.order.constants.ts
 * Author      : Michael LeDuc
 * Created Date: Mon Feb 10 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

export enum PagingOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export const DEFAULT_PAGING_LIMIT = 20;
export const DEFAULT_PAGING_ORDER = PagingOrder.ASC;
export const DEFAULT_PAGING_ORDER_BY = 'id';
