import { ApiSchema } from '@nestjs/swagger';
import { PagingOptionsDto } from '../paging';
import { ISearchFilter } from './search-query';
import { ValueOperator } from './value-operator';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

@ApiSchema({ name: 'search-query' })
export class SearchQueryDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SearchFilterDto)
  filters?: SearchFilterDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PagingOptionsDto)
  paging?: PagingOptionsDto;
}

export class SearchFilterDto implements ISearchFilter {
  @IsString()
  field: string;

  @Type(() => String)
  operator: ValueOperator;

  value: any;

  @IsOptional()
  @IsBoolean()
  reverse?: boolean | undefined;
}
