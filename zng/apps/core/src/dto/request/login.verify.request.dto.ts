import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { LoginRequestDto } from './login.request.dto';
import { Expose } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

@ApiSchema({ name: 'loginVerifyRequest' })
export class LoginVerifyRequestDto extends LoginRequestDto {
  @ApiProperty({ description: 'Verification code', type: String, required: true, maxLength: 6, example: '123456' })
  @Expose()
  @IsNotEmpty()
  code: string;
}
