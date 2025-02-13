import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

@ApiSchema({ name: 'user' })
export class UserCreateRequestDto {
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
  @IsString()
  @IsOptional()
  phoneNumber: string;

  normalizedPhoneNumber?: string;
}
