import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

@ApiSchema({ name: 'apiStatus' })
export class ApiStatusResponseDto {
  @ApiProperty()
  @IsString()
  @Expose()
  status: string;

  @ApiProperty()
  @IsString()
  @Expose()
  message: string;

  @ApiProperty()
  @IsOptional()
  @Expose()
  data?: unknown;

  constructor(status: string, message: string, data?: unknown) {
    this.status = status;
    this.message = message;
    this.data = data;
  }
}
