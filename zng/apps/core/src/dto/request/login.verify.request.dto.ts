import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { LoginRequestDto } from './login.request.dto';
import { Expose } from 'class-transformer';

@ApiSchema({ name: 'loginVerifyRequest' })
export class LoginVerifyRequestDto extends LoginRequestDto {
  @ApiProperty({ description: 'Verification code', type: String, required: true, maxLength: 6, example: '123456' })
  @Expose()
  code: string;
}
