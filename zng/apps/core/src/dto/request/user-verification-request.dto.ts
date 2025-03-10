import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ApiSchema } from '@library/shared/common/decorators/api-schema.decorator';
import { IsUUID, IsNotEmpty, MaxLength, IsString } from 'class-validator';

@ApiSchema({ name: 'userVerificationRequest' })
export class UserVerificationRequestDto {
  @ApiProperty({ description: 'Id of the User', type: String, required: true })
  @Expose()
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Verification State', type: String, required: true, maxLength: 32 })
  @Expose()
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  verificationState: string;

  @ApiProperty({ description: 'Verification code', type: String, required: true })
  @Expose()
  @IsNotEmpty()
  @IsString()
  @MaxLength(32)
  verificationCode: string;
}
