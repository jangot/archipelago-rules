export class UserLoginPayloadDto {
  accessToken?: string; // Jwt base 64 encoded
  refreshToken?: string; // Jwt base 64 encoded
  accessTokenExpiresIn?: Date;
  refreshTokenExpiresIn?: Date;
  userId?: string; // User id - uuid
  onboardingStatus?: string; // Used during Onboarding / registration to provide initial starting point
  verificationCode?: string; // TODO: remove when notification service is implemented
}
