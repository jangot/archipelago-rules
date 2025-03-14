export class UserLoginPayloadDto {
  accessToken: string; // Jwt base 64 encoded
  userId: string; // User id - uuid
  onboardingStatus: string; // Used during Onboarding / registration to provide initial starting point
}
