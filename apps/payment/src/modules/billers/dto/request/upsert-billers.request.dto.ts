import { BillerNetworkType, BillerNetworkTypeCodes } from '@library/entity/enum/biller-network.type';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for upserting billers by processing a biller file or resource.
 */
export class UpsertBillersRequestDto {
  /**
   * The type of biller network (e.g., 'rpps', 'other').
   */
  @ApiProperty({
    description: 'The type of biller network',
    enum: BillerNetworkTypeCodes,
    example: BillerNetworkTypeCodes.RPPS,
  })
  @IsEnum(BillerNetworkTypeCodes)
  billerNetworkType!: BillerNetworkType;

  /**
   * The path to the biller file or resource to be processed.
   */
  @ApiProperty({
    description: 'The path to the biller file or resource to be processed',
    example: 'path/to/biller/file.txt',
  })
  @IsString()
  @IsNotEmpty()
  path!: string;
} 
