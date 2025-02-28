import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class JwtResponseDto {
  @ApiProperty({ description: 'JWT access token', type: String })
  @Expose()
  accessToken: string;
}
