/*
 * File Name   : paging.meta.model.ts
 * Author      : Michael LeDuc
 * Created Date: Mon Feb 10 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { ApiSchema, ApiProperty } from '@nestjs/swagger';
import { IPageMetaParameters } from './paging.metaparameters.interface';
import { cloneDeep } from 'lodash';
import { IPagingOptions } from './paging.options.interface';
import { IPagingMeta } from './paging.meta.interface';
import { PagingOptionsDto } from './paging.options.dto';
import { DEFAULT_PAGING_LIMIT } from './paging.order.constants';

@ApiSchema({ name: 'pageMeta' })
export class PagingMetaDto implements IPagingMeta {
  @ApiProperty()
  offset: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalCount: number;

  // Will copy over PageOptionsDto and derived class values added to it
  @ApiProperty({ type: PagingOptionsDto })
  public previousPage?: IPagingOptions | null = null;

  // Will copy over PageOptionsDto and derived class values added to it
  @ApiProperty({ type: PagingOptionsDto })
  public nextPage?: IPagingOptions | null = null;

  constructor({ pageOptions, currentCount, totalCount }: IPageMetaParameters) {
    this.offset = pageOptions.offset || 0;
    this.limit = pageOptions.limit || DEFAULT_PAGING_LIMIT;
    this.totalCount = totalCount;

    this.calculatePreviousPage(pageOptions, currentCount);
    this.calculateNextPage(pageOptions, currentCount);
  }

  // calculate previous page
  private calculatePreviousPage(pageOptions: IPagingOptions, currentCount: number) {
    if (currentCount === 0) {
      return;
    }

    // If the current count is less than the limit, then there are no more pages
    if (this.offset > 0 && this.totalCount > 0) {
      this.previousPage = cloneDeep(pageOptions);
      this.previousPage.offset = Math.max(0, this.offset - this.limit);
    }
  }

  // calculate next page
  private calculateNextPage(pageOptions: IPagingOptions, currentCount: number) {
    if (currentCount === 0) {
      return;
    }

    // If the current count is less than the limit, then there are no more pages
    if (this.offset + this.limit < this.totalCount) {
      this.nextPage = cloneDeep(pageOptions);
      this.nextPage.offset = Math.max(0, this.offset + this.limit);
    }
  }
}
