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
import { DEFAULT_PAGING_LIMIT, PagingOrder } from './paging.order.constants';
import { IPagingOptions } from './paging.options.interface';

@ApiSchema({ name: 'pagingOptions' })
export class PagingOptionsDto implements IPagingOptions {
  @ApiPropertyOptional({ enum: PagingOrder, default: PagingOrder.ASC })
  @IsEnum(PagingOrder)
  @IsOptional()
  order?: PagingOrder = PagingOrder.ASC;

  @ApiPropertyOptional({ default: 'Id' })
  @IsOptional()
  @IsString()
  orderBy?: string = 'Id';

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
