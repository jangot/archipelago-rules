import { LoginType, RegistrationStatus, VerificationStatus } from '@library/entity/enum';

export class RegistrationLogic {
  private static PendingRegistrationStates: RegistrationStatus[] = [RegistrationStatus.EmailVerifying, RegistrationStatus.PhoneNumberVerifying];

  public static isPendingRegistrationState(state: RegistrationStatus): boolean {
    return this.PendingRegistrationStates.includes(state);
  }

  public static calculateNewRegistrationStatus(existingRegistrationStatus: RegistrationStatus): RegistrationStatus {
    if (!this.isPendingRegistrationState(existingRegistrationStatus)) {
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

  public static getLoginTypeForRegistrationStatus(newStatus: RegistrationStatus): LoginType {
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
  public static shouldCreateUserLogin(newStatus: RegistrationStatus): boolean {
    return newStatus === RegistrationStatus.EmailVerified;
  }

  public static calculateNewVerificationStatus(verificationStatus: VerificationStatus): VerificationStatus {
    return verificationStatus === VerificationStatus.Verifying ? VerificationStatus.Verified : verificationStatus;
  }
}
