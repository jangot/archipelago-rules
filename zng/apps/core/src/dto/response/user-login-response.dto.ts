import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class UserLoginResponseDTO {
  @ApiProperty({ description: 'Id of the User', type: String, required: true })
  @Expose({ name: 'id' }) // Example of mapping the Entity 'id' field to the userId field here
  @IsString()
  @IsUUID()
  userId: string; // User id - uuid

  @ApiProperty({ description: 'Verification code - remove when Notification is complete', type: String, required: true })
  @Expose()
  @IsNotEmpty()
  @IsString()
  @MaxLength(32)
  verificationCode?: string; // TODO: remove when notification service is implemented
}
