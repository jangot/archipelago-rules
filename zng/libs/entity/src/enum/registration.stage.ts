export enum OrganicEmailRegistrationStage {
  Initiated = 'initiated', // We got a request to register a user with email
  EmailSet = 'email-set', // We checked email for uniqueness and created the user
  EmailVerificationSent = 'email-verification-sent', // We sent an email verification code
  Verified = 'verified', // Code accepted, email is verified
}

export enum OrganicPhoneRegistrationStage {
  Initiated = 'initiated', // We continue with Organic, awaiting phone number
  PhoneNumberSet = 'phone-number-set', // We checked phone number for uniqueness and updated the user
  PhoneNumberVerificationSent = 'phone-number-verification-sent', // We sent a phone number verification code
  Verified = 'verified', // Code accepted, phone number is verified, User is Verified
}

export enum SandboxBypassRegistrationStage {
  Initiated = 'initiated',
  Verified = 'verified',
}
