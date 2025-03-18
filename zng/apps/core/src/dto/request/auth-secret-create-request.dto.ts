import { LoginType } from '@library/entity/enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsDate } from 'class-validator';

export class AuthSecretCreateRequestDto {
  @ApiProperty({ enum: LoginType })
  @IsEnum(LoginType)
  type: LoginType;

  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsString()
  secret: string;

  @ApiProperty({ required: false, type: Date })
  @IsOptional()
  @IsDate()
  expiresAt?: Date | undefined;
}
