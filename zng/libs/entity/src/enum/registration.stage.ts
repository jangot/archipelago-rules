export enum OrganicRegistrationStage {
  Initiated = 'initiated',
  EmailSet = 'email-set',
  EmailVerificationSent = 'email-verification-sent',
  PhoneNumberSet = 'phone-number-set',
  PhoneNumberVerificationSent = 'phone-number-verification-sent',
  Verified = 'verified',
}

export enum SandboxBypassRegistrationStage {
  Initiated = 'initiated',
  Verified = 'verified',
}
