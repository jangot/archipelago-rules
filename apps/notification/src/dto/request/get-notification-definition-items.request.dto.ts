import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsUUID } from 'class-validator';

/**
 * DTO for query parameters when getting notification definition items
 */
export class GetNotificationDefinitionItemsRequestDto {
  /**
   * Optional filter by notification definition ID
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({
    description: 'Filter by notification definition ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @Transform(({ value }) => value === '' ? undefined : value)
  notificationDefinitionId?: string;
}
