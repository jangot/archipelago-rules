import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { PagingOptionsDto } from '../paging';
import { ISearchFilter } from './search-query';
import { ValueOperator } from './value-operator';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

@ApiSchema({ name: 'searchFilter' })
export class SearchFilterDto implements ISearchFilter {
  @ApiProperty({ description: 'Field to filter on', type: String, example: 'name' })
  @IsString()
  field: string;

  @ApiProperty({ description: 'Operator to use for filtering', enum: ValueOperator, example: ValueOperator.EQUALS })
  @Type(() => String)
  operator: ValueOperator;

  @ApiProperty({ description: 'Value to filter on', type: String, example: 'John' })
  value: any;
}

@ApiSchema({ name: 'searchQuery' })
export class SearchQueryDto {
  @ApiProperty({ description: 'Array of filters', type: [SearchFilterDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SearchFilterDto)
  filters?: SearchFilterDto[];

  @ApiProperty({ description: 'Paging options', type: PagingOptionsDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => PagingOptionsDto)
  paging?: PagingOptionsDto;
}
