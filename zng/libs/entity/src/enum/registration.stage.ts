export enum OrganicEmailRegistrationStage {
  Initiated = 'initiated',
  EmailSet = 'email-set',
  EmailVerificationSent = 'email-verification-sent',
  Verified = 'verified',
}

export enum OrganicPhoneRegistrationStage {
  Initiated = 'initiated',
  PhoneNumberSet = 'phone-number-set',
  PhoneNumberVerificationSent = 'phone-number-verification-sent',
  Verified = 'verified',
}

export enum SandboxBypassRegistrationStage {
  Initiated = 'initiated',
  Verified = 'verified',
}
