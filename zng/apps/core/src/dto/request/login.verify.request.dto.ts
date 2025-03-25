import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { LoginRequestDto } from './login.request.dto';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

@ApiSchema({ name: 'loginVerifyRequest' })
export class LoginVerifyRequestDto extends LoginRequestDto {
  @ApiProperty({ description: 'Id of the User', type: String, required: true })
  @Expose({ name: 'id' }) // Example of mapping the Entity 'id' field to the userId field here
  @IsString()
  @IsUUID()
  userId: string; // User id - uuid

  @ApiProperty({ description: 'Verification code', type: String, required: true, maxLength: 6, example: '123456' })
  @Expose()
  @IsNotEmpty()
  code: string;
}
