/*
 * File Name   : paging.options.model.ts
 * Author      : Michael LeDuc
 * Created Date: Mon Feb 10 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { DEFAULT_PAGING_LIMIT, DEFAULT_PAGING_ORDER, DEFAULT_PAGING_ORDER_BY, PagingOrder } from './paging.order.constants';
import { IPagingOptions } from './paging.options.interface';

@ApiSchema({ name: 'pagingOptions' })
export class PagingOptionsDto implements IPagingOptions {
  @ApiPropertyOptional({ enum: PagingOrder, default: DEFAULT_PAGING_ORDER })
  @IsEnum(PagingOrder)
  @IsOptional()
  order?: PagingOrder = DEFAULT_PAGING_ORDER;

  @ApiPropertyOptional({ default: DEFAULT_PAGING_ORDER_BY })
  @IsOptional()
  @IsString()
  orderBy?: string = DEFAULT_PAGING_ORDER_BY;

  @ApiPropertyOptional({ minimum: 0, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number = 0;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: DEFAULT_PAGING_LIMIT })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = DEFAULT_PAGING_LIMIT;
}
