import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { LoginRequestDto } from './login.request.dto';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

@ApiSchema({ name: 'loginVerifyRequest' })
export class LoginVerifyRequestDto extends LoginRequestDto {
  @ApiProperty({ description: 'Id of the User', type: String, required: true })
  // TODO: Calling @Expose() from 'class-transformer' to map the 'id' field from the 'userId' field will cause an issue
  // AS this happens right before 'class-validatior' will run its checks - these checks will fail but seems that field is still in the payload
  // see simillar issue in official repo: https://github.com/typestack/class-validator/issues/1559
  // Commented out for now as there no further usage of 'class-transformer' methods for login verification flow
  // @Expose({ name: 'id' }) // Example of mapping the Entity 'id' field to the userId field here
  @IsString()
  @IsUUID()
  userId: string; // User id - uuid

  @ApiProperty({ description: 'Verification code', type: String, required: true, maxLength: 6, example: '123456' })
  @Expose()
  @IsNotEmpty()
  code: string;
}
