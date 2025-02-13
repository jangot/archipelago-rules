/*
 * File Name   : paging.interface.ts
 * Author      : Michael LeDuc
 * Created Date: Mon Feb 10 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { IPagingMeta } from './paging.meta.interface';

export class IPaging<T> {
  data: T[];
  meta: IPagingMeta;
}
