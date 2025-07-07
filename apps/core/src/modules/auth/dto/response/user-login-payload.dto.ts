import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsUUID } from 'class-validator';

@ApiSchema({ name: 'userLoginPayload' })
export class UserLoginPayloadDto {
  @ApiProperty({ description: 'Access Token', type: String, required: true })
  @Expose()
  @IsString()
  accessToken?: string; // Jwt base 64 encoded

  @ApiProperty({ description: 'Refresh Token', type: String, required: true })
  @Expose()
  @IsString()
  refreshToken?: string; // Jwt base 64 encoded

  @ApiProperty({ description: 'Access Token Expires At', type: Date, required: true })
  @Expose()
  @IsString()
  accessTokenExpiresAt?: Date;

  @ApiProperty({ description: 'Refresh Token Expires At', type: Date, required: true })
  @Expose()
  @IsString()
  refreshTokenExpiresAt?: Date;

  @ApiProperty({ description: 'User Id', type: String, required: true })
  @Expose()
  @IsString()
  @IsUUID()
  userId?: string; // User id - uuid

  @ApiProperty({ description: 'Onboarding Status', type: String, required: true })
  @Expose()
  @IsString()
  onboardingStatus?: string; // Used during Onboarding / registration to provide initial starting point

  @ApiProperty({ description: 'Verification Code', type: String, required: true })
  @Expose()
  @IsString()
  verificationCode?: string; // TODO: remove when notification service is implemented
}
