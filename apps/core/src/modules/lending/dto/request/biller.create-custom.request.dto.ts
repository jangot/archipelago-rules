import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

@ApiSchema({ name: 'billerCreateCustomRequest' })
export class BillerCreateCustomRequestDto {
  @ApiProperty({ description: 'The name of the biller', type: String, required: true, example: 'John Doe Pizza' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  name: string;
}
