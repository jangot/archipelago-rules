import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { MapTo } from '@library/entity/mapping/mapping.decorators';
import { transformPhoneNumber } from '@library/shared/common/data/transformers/phone-number.transformer';
import { IsValidPhoneNumber } from '@library/shared/common/validators/phone-number.validator';
import { Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty, MaxLength, IsOptional, IsString } from 'class-validator';

@ApiSchema({ name: 'loginRequest' })
export class LoginRequestDto {
  @ApiProperty({ description: 'User email', type: String, required: false, maxLength: 320, example: 'test@email.com' })
  @Expose()
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(320)
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'User phone number', type: String, required: false, maxLength: 32, default: null })
  @Expose()
  @IsNotEmpty()
  @MaxLength(32)
  @IsString()
  @IsOptional()
  @IsValidPhoneNumber()
  @MapTo({ transform: transformPhoneNumber })
  phoneNumber?: string;
}
