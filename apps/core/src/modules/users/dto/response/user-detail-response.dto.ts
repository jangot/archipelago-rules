import { ApiProperty, ApiSchema, OmitType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDate, IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, IsUUID, MaxLength } from 'class-validator';

@ApiSchema({ name: 'userDetailResponse' })
export class UserDetailResponseDto {

  @ApiProperty({ description: 'Id of the User', type: String, required: true })
  @Expose({ name: 'userId' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Date Delete at', type: Date, required: false })
  @IsDate()
  deletedAt: Date | null;

  @ApiProperty({ description: 'User email', type: String, required: true, maxLength: 320 })
  @Expose()
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(320)
  email: string;

  @ApiProperty({ description: 'User First Name', type: String, required: true, maxLength: 100 })
  @Expose()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ description: 'User Last Name', type: String, required: true, maxLength: 100 })
  @Expose()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ description: 'User phone number', type: String, required: true, maxLength: 32 })
  @Expose()
  @IsNotEmpty()
  @MaxLength(32)
  @IsPhoneNumber()
  @IsOptional()
  phoneNumber: string;

  @ApiProperty({ description: 'User Date of Birth', type: String, required: true, maxLength: 10 })
  @Expose()
  @IsString()
  @MaxLength(10)
  dateOfBirth: string;

  @ApiProperty({ description: 'User address line 1', type: String, required: true })
  @Expose()
  @IsString()
  addressLine1: string;

  @ApiProperty({ description: 'User address line 2', type: String, required: false })
  @Expose()
  @IsOptional()
  @IsString()
  addressLine2: string | null;

  @ApiProperty({ description: 'User city', type: String, required: true })
  @Expose()
  @IsString()
  city: string;

  @ApiProperty({ description: 'User state', type: String, required: true })
  @Expose()
  @IsString()
  state: string;

  @ApiProperty({ description: 'User zip code', type: String, required: true })
  @Expose()
  @IsString()
  zipCode: string;

  @ApiProperty({ description: 'Onboarding status', type: String, required: true })
  @Expose()
  @IsString()
  onboardingStatus: string;
}

export class UserDetailsUpdateResponseDto extends OmitType(UserDetailResponseDto, ['deletedAt'] as const) {}
