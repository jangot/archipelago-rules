import { ContactType, RegistrationStatus } from '@library/entity/enum';
import { VerificationType } from '@library/entity/enum/verification.type';

export class LoginLogic {
  public static isUserRegistered(contactType: ContactType, registrationStatus: RegistrationStatus): boolean {
    return (
      (contactType === ContactType.EMAIL && registrationStatus === RegistrationStatus.EmailVerified) ||
      registrationStatus === RegistrationStatus.Registered
    );
  }

  public static getVerificationTypeByContactType(contactType: ContactType): VerificationType | null {
    switch (contactType) {
      case ContactType.EMAIL:
        return VerificationType.Email;
      case ContactType.PHONE_NUMBER:
        return VerificationType.PhoneNumber;
      default:
        return null;
    }
  }

  public static isLoginLocked(verificationLockedUntil: Date | null): boolean {
    return verificationLockedUntil !== null && verificationLockedUntil > new Date(Date.now());
  }
}
