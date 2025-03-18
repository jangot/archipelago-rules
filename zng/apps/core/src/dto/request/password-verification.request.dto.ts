import { MapTo } from '@library/entity/mapping/mapping.decorators';
import { transformPhoneNumber } from '@library/shared/common/data/transformers/phone-number.transformer';
import { IsValidPhoneNumber } from '@library/shared/common/validators/phone-number.validator';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

@ApiSchema({ name: 'passwordVerification' })
export class PasswordVerificationDto {
  @ApiProperty({ description: 'User email', type: String, required: false, maxLength: 320 })
  @ValidateIf((o) => !o.phoneNumber, { always: true, message: 'Either email or phoneNumber is required' })
  @Expose()
  @IsString()
  @IsEmail()
  @MaxLength(320)
  @IsNotEmpty()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'User phone number', type: String, required: false, maxLength: 32 })
  @ValidateIf((o) => !o.email, { always: true, message: 'Either email or phoneNumber is required' })
  @Expose()
  @MaxLength(32)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @IsValidPhoneNumber()
  @MapTo({ transform: transformPhoneNumber })
  phoneNumber?: string;

  @ApiProperty({ description: 'User password', type: String, required: true })
  @IsNotEmpty()
  password: string;
}
