import { ApplicationUser } from '@library/shared/domain/entity';

export class VerificationEventPayload {
  public userId: string;
  public userFirstName: string | null;
  public userLastName: string | null;
  public userEmail: string | null;
  public userPhoneNumber: string | null;

  constructor(user: ApplicationUser) {
    this.userId = user.id;
    this.userFirstName = user.firstName;
    this.userLastName = user.lastName;
    this.userEmail = user.email;
    this.userPhoneNumber = user.phoneNumber;
  }
}
