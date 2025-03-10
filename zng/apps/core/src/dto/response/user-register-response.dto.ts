import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ApiSchema } from '@library/shared/common/decorators/api-schema.decorator';
import { IsUUID, IsEmail, IsNotEmpty, MaxLength, IsOptional, IsString } from 'class-validator';

@ApiSchema({ name: 'userRegisterResponse' })
export class UserRegisterResponseDto {
  @ApiProperty({ description: 'Id of the User', type: String, required: true })
  @Expose()
  @IsString()
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'User email', type: String, required: false, maxLength: 320 })
  @Expose()
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  @MaxLength(320)
  @IsOptional()
  email: string | null;

  @ApiProperty({ description: 'User phone number', type: String, required: false, maxLength: 32 })
  @Expose()
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  @MaxLength(320)
  @IsOptional()
  phoneNumber: string | null;

  @ApiProperty({ description: 'Verification State', type: String, required: false, maxLength: 32 })
  @Expose()
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  verificationState: string;

  // TODO: remove this field from response
  @ApiProperty({ description: 'Verification code', type: String, required: true })
  @Expose()
  @IsString()
  verificationCode: string;
}
