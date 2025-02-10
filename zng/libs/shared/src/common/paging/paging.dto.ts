/*
 * File Name   : paging.model.ts
 * Author      : Michael LeDuc
 * Created Date: Mon Feb 10 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */
import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { IsArray } from "class-validator";
import { PagingMetaDto } from './paging.meta.dto';
import { IPaging } from './paging.interface';
import { IPagingMeta } from './paging.meta.interface';
import { PagingOrder } from './paging.order.constants';


@ApiSchema({name: 'page'})
export class PagingDto<T> implements IPaging<T> {
    @IsArray()
    @ApiProperty({isArray: true})
    data: T[];

    @ApiProperty({type: PagingMetaDto})
    meta: IPagingMeta;

    constructor(data: T[], meta: IPagingMeta) {
        this.data = data;
        this.meta = meta;
    }
}

export interface PaginationOptions<T> {  
  order?: PagingOrder;
  orderBy?: string;
  offset?: number;
  limit?: number;
  currentCount: number;
  totalCount: number;
  data: T[];
}

export function createPaginationWrapper<T>(options: PaginationOptions<T>): IPaging<T> {
  const pagingMeta: IPagingMeta = new PagingMetaDto({
    pageOptions: { order: options.order, orderBy: options.orderBy, offset: options.offset, limit: options.limit },
    currentCount: options.currentCount,
    totalCount: options.totalCount
  });

  const result = new PagingDto(options.data, pagingMeta);

  return result;
}