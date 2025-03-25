import { ContactType, RegistrationStatus } from '@library/entity/enum';

export class LoginLogic {
  public static isUserRegistered(contactType: ContactType, registrationStatus: RegistrationStatus): boolean {
    return (
      (contactType === ContactType.EMAIL && registrationStatus === RegistrationStatus.EmailVerified) ||
      registrationStatus === RegistrationStatus.Registered
    );
  }
}
