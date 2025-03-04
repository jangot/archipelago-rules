import { RegistrationType } from '@library/entity/enum';
import { MapTo } from '@library/entity/mapping/mapping.decorators';
import { transformPhoneNumber } from '@library/shared/common/data/transformers/phone-number.transformer';
import { IsValidPhoneNumber } from '@library/shared/common/validators/phone-number.validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class OrganicRegistrationRequestDto {
  @ApiProperty({ description: 'User ID', type: String, required: false, maxLength: 36 })
  @Expose()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  userId: string | null;

  @ApiProperty({ description: 'User First Name', type: String, required: false, maxLength: 100 })
  @Expose()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsOptional()
  firstName?: string;

  @ApiProperty({ description: 'User Last Name', type: String, required: false, maxLength: 100 })
  @Expose()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsOptional()
  lastName?: string;

  @ApiProperty({ description: 'User email', type: String, required: false, maxLength: 320 })
  @Expose()
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(320)
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'User phone number', type: String, required: false, maxLength: 32 })
  @Expose()
  @IsNotEmpty()
  @MaxLength(32)
  @IsString()
  @IsOptional()
  @IsValidPhoneNumber()
  @MapTo({ transform: transformPhoneNumber })
  phoneNumber?: string;

  @ApiProperty({ description: 'Registration step verification code', type: String, required: false, maxLength: 100 })
  @IsNotEmpty()
  @MaxLength(32)
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ description: 'Should last verification step be re-tried', type: Boolean, required: false })
  @IsOptional()
  @IsBoolean()
  retry = false;

  @ApiProperty({ description: 'Registration flow type', type: String, required: true })
  type: RegistrationType.Organic = RegistrationType.Organic;
}
