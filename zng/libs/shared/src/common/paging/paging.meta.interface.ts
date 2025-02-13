/*
 * File Name   : paging.meta.interface.ts
 * Author      : Michael LeDuc
 * Created Date: Mon Feb 10 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { IPagingOptions } from './paging.options.interface';

export interface IPagingMeta {
  offset: number;
  limit: number;
  totalCount: number;
  previousPage?: IPagingOptions;
  nextPage?: IPagingOptions;
}
