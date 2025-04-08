import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDate, IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, IsUUID, MaxLength } from 'class-validator';

@ApiSchema({ name: 'userDetailResponse' })
export class UserDetailResponseDTO {
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

  @ApiProperty({ description: 'Id of the User', type: String, required: true })
  @Expose({ name: 'id' }) // Example of mapping the Entity 'id' field to the userId field here
  @IsString()
  @IsUUID()
  userId: string;

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
}
