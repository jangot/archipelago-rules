import { BillerNetworkType, BillerNetworkTypeCodes } from '@library/entity/enum/biller-network.type';
import { IsEnum, IsString } from 'class-validator';

/**
 * IngestBillerFileRequestDto defines the request body for ingesting a biller file.
 */
export class IngestBillerFileRequestDto {
  /** The type of biller network */
  @IsEnum(BillerNetworkTypeCodes)
  billerNetworkType!: BillerNetworkType;

  /** The path to the file to be ingested */
  @IsString()
  filePath!: string;
} 
