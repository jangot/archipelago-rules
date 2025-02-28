import { AuthSecretType } from '@library/entity/enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsDate } from 'class-validator';

export class AuthSecretCreateRequestDto {
  @ApiProperty({ enum: AuthSecretType })
  @IsEnum(AuthSecretType)
  type: AuthSecretType;

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
