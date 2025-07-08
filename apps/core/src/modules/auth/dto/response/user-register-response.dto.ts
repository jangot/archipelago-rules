import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsUUID } from 'class-validator';

@ApiSchema({ name: 'userRegisterResponse' })
export class UserRegisterResponseDto {
  @ApiProperty({ description: 'Id of the User', type: String, required: true })
  @Expose()
  @IsString()
  @IsUUID()
  userId: string;

  // TODO: remove this field from response
  @ApiProperty({ description: 'Verification code', type: String, required: true })
  @Expose()
  @IsString()
  verificationCode: string;
}
