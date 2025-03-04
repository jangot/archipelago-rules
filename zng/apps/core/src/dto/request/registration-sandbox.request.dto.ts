import { RegistrationType } from '@library/entity/enum';
import { MapTo } from '@library/entity/mapping/mapping.decorators';
import { transformPhoneNumber } from '@library/shared/common/data/transformers/phone-number.transformer';
import { IsValidPhoneNumber } from '@library/shared/common/validators/phone-number.validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SandboxRegistrationRequestDto {
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
  firstName: string;

  @ApiProperty({ description: 'User Last Name', type: String, required: false, maxLength: 100 })
  @Expose()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ description: 'User email', type: String, required: false, maxLength: 320 })
  @Expose()
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(320)
  email: string;

  @ApiProperty({ description: 'User phone number', type: String, required: false, maxLength: 32 })
  @Expose()
  @IsNotEmpty()
  @MaxLength(32)
  @IsString()
  @IsValidPhoneNumber()
  @MapTo({ transform: transformPhoneNumber })
  phoneNumber: string;

  @ApiProperty({ description: 'Registration flow type', type: String, required: false, enum: RegistrationType })
  @IsOptional()
  type: RegistrationType.SandboxBypass = RegistrationType.SandboxBypass;
}
