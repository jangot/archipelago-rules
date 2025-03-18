import { Expose } from 'class-transformer';
import { UserCreateRequestDto } from './user-create-request.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UserRegisterRequestDto extends UserCreateRequestDto {
  @ApiProperty({ description: 'User password', type: String, required: true })
  @Expose()
  @IsString()
  @IsNotEmpty()
  password: string;
}
