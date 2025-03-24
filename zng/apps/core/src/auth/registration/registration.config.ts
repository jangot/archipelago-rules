import { LoginType, RegistrationStatus } from '@library/entity/enum';

const PendingRegistrationStates: RegistrationStatus[] = [RegistrationStatus.EmailVerifying, RegistrationStatus.PhoneNumberVerifying];

export function isPendingRegistrationState(state: RegistrationStatus): boolean {
  return PendingRegistrationStates.includes(state);
}

export function calculateNewRegistrationStatus(existingRegistrationStatus: RegistrationStatus): RegistrationStatus {
  if (!isPendingRegistrationState(existingRegistrationStatus)) {
    throw new Error(`Invalid registration status: ${existingRegistrationStatus}`);
  }

  switch (existingRegistrationStatus) {
    case RegistrationStatus.EmailVerifying:
      return RegistrationStatus.EmailVerified;
    case RegistrationStatus.PhoneNumberVerifying:
      return RegistrationStatus.PhoneNumberVerified;
    default:
      throw new Error(`Unexpected registration status: ${existingRegistrationStatus}`);
  }
}

export function getLoginTypeForRegistrationStatus(newStatus: RegistrationStatus): LoginType {
  switch (newStatus) {
    case RegistrationStatus.EmailVerified:
      return LoginType.OneTimeCodeEmail;
    case RegistrationStatus.PhoneNumberVerified:
      return LoginType.OneTimeCodePhoneNumber;
    default:
      throw new Error(`Invalid registration status: ${newStatus}`);
  }
}

// This function determines if a user login should be created based on the new registration status.
// It returns true if the new status is EmailVerified, indicating that a user login should be created.
export function shouldCreateUserLogin(newStatus: RegistrationStatus): boolean {
  return newStatus === RegistrationStatus.EmailVerified;
}
