import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';
import { NIL } from 'uuid';

@ApiSchema({ name: 'billerResponse' })
export class BillerResponseDto {
  @ApiProperty({ description: 'Unique identifier of the biller', example: NIL })
  @IsUUID()
  billerId: string;

  @ApiProperty({ description: 'Name of the biller', example: 'Electric Company' })
  @IsString()
  billerName: string;

  @ApiProperty({ description: 'Postal code of the biller', example: '12345' })
  @IsString()
  billerPostalCode: string;

  @ApiProperty({ description: 'Class of the biller', example: 'Utility' })
  @IsString()
  billerClass: string;
}
