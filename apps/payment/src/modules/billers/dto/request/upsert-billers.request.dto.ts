import { BillerNetworkType, BillerNetworkTypeCodes } from '@library/entity/enum/biller-network.type';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { FileOriginType } from '../../interfaces/file-origin-type.enum';

/**
 * DTO for upserting billers by processing a biller file or resource.
 * This DTO might be used temporarily to test the biller file processing functionality.
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
   * The origin of the file (local, s3, etc).
   */
  @ApiProperty({
    description: 'The origin of the file (local, s3, etc)',
    enum: FileOriginType,
    example: FileOriginType.Local,
  })
  @IsEnum(FileOriginType)
  fileOrigin!: FileOriginType;

  /**
   * The resource identifier (file path, S3 key, etc).
   */
  @ApiProperty({
    description: 'The resource identifier (file path, S3 key, etc)',
    example: 'path/to/biller/file.txt',
  })
  @IsString()
  @IsNotEmpty()
  resource!: string;
} 
