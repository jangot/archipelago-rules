import { RegistrationStatus } from '@library/entity/enum';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, IsUUID, MaxLength } from 'class-validator';

@ApiSchema({ name: 'userResponse' })
export class UserResponseDto {
  @ApiProperty({ description: 'Id of the User', type: String, required: true })
  @Expose({ name: 'id' }) // Example of mapping the Entity 'id' field to the userId field here
  @IsString()
  @IsUUID()
  userId: string;

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

  @ApiProperty({ description: 'User email', type: String, required: true, maxLength: 320 })
  @Expose()
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(320)
  email: string;

  @ApiProperty({ description: 'User phone number', type: String, required: true, maxLength: 32 })
  @Expose()
  @IsNotEmpty()
  @MaxLength(32)
  @IsPhoneNumber()
  @IsOptional()
  phoneNumber: string;

  @ApiProperty({ description: 'Registration Status', type: String, required: true, enum: RegistrationStatus })
  @Expose()
  registrationStatus: RegistrationStatus;

  @ApiProperty({ description: 'Onboarding Status', type: String, required: true, maxLength: 32 })
  @Expose()
  @IsNotEmpty()
  @MaxLength(32)
  onboardStatus: string;

  @Exclude()
  loginId?: string | null;
}
