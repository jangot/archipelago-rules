import { MapTo } from '@library/entity/mapping/mapping.decorators';
import { transformPhoneNumber } from '@library/shared/common/data/transformers/phone-number.transformer';
import { IsValidPhoneNumber } from '@library/shared/common/validators/phone-number.validator';
import { ApiProperty, ApiSchema, OmitType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { NIL } from 'uuid';

@ApiSchema({ name: 'registration' })
export class RegistrationDto {
  @ApiProperty({ description: 'User ID', type: String, required: false, maxLength: 36, example: NIL })
  @Expose()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  userId: string | null;

  @ApiProperty({ description: 'User First Name', type: String, required: false, maxLength: 100, example: 'John' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsOptional()
  firstName?: string;

  @ApiProperty({ description: 'User Last Name', type: String, required: false, maxLength: 100, example: 'Doe' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsOptional()
  lastName?: string;

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

  @ApiProperty({
    description: 'Registration step verification code',
    type: String,
    required: false,
    maxLength: 100,
    example: '123456',
  })
  @IsNotEmpty()
  @MaxLength(32)
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({
    description: 'Should last verification step be re-tried',
    type: Boolean,
    required: false,
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  retry = false;

}

@ApiSchema({ name: 'registrationRequest' })
export class RegistrationRequestDto extends OmitType(RegistrationDto, [
  'userId',
  'phoneNumber',
  'retry',
  'code',
] as const) {}

@ApiSchema({ name: 'registrationVerifyRequest' })
export class RegistrationVerifyRequestDto extends OmitType(RegistrationDto, [
  'firstName',
  'lastName',
  'email',
  'phoneNumber',
] as const) {}

@ApiSchema({ name: 'registrationAdvanceRequest' })
export class RegistrationAdvanceRequestDto extends OmitType(RegistrationDto, [
  'firstName',
  'lastName',
  'email',
  'code',
  'retry',
] as const) {}
