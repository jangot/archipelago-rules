import { BillerType, BillerTypeCodes } from '@library/entity/enum';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';
import { NIL } from 'uuid';

@ApiSchema({ name: 'billerResponse' })
export class BillerResponseDto {
  @ApiProperty({ description: 'Unique identifier of the biller', example: NIL })
  @IsUUID()
  @Expose()
  id: string;

  @ApiProperty({ description: 'Name of the biller', example: 'Electric Company' })
  @IsString()
  @Expose()
  name: string;

  /** Type of the Biller: 
     * `network` - Biller was imported from Billers network (biller_network); 
     * `custom` - Biller that was added by User (not found in Billers network); 
     * `personal` - Emulates the real Biller for P2P Loans. */
  @ApiProperty({ description: 'Type of the biller', enum: BillerTypeCodes, example: BillerTypeCodes.Network })
  @Expose()
  type: BillerType;

  @ApiProperty({ description: 'Date when the biller was created', example: '2023-01-01T00:00:00.000Z' })
  @IsDate()
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Date when the biller was last updated', example: '2023-01-02T00:00:00.000Z', nullable: true })
  @IsOptional()
  @IsDate()
  @Expose()
  updatedAt: Date | null;

  @ApiProperty({ description: 'ID of the user who created the biller', example: NIL, nullable: true })
  @IsOptional()
  @IsUUID()
  createdById: string | null;
}
