/*
 * File Name   : paging.options.interface.ts
 * Author      : Michael LeDuc
 * Created Date: Mon Feb 10 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */
import { PagingOrder } from './paging.order.constants';

export interface IPagingOptions {
  order?: PagingOrder;
  orderBy?: string;
  offset?: number;
  limit?: number;
}
