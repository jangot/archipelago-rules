import { EntityId, ISoftDeleteEntity } from '@library/shared/common/data';
import { RegistrationStatus } from '../enum/registration.status';
import { VerificationStatus } from '../enum/verification.status';
import { VerificationType } from '../enum/verification.type';

export interface IApplicationUser extends EntityId<string>, ISoftDeleteEntity {
  id: string; // UUID

  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;

  pendingEmail: string | null;
  email: string | null;

  pendingPhoneNumber: string | null;
  phoneNumber: string | null;

  createdAt: Date;
  deletedAt: Date | null;

  registrationStatus: RegistrationStatus;
  onboardStatus: string | null;

  // Address fields
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;

  // New fields related to login verification (not used during registration)
  verificationType: VerificationType | null; // For storing the type of login being attempted (e.g., email, phone)
  secret: string | null; // For storing the secret used for login verification
  secretExpiresAt: Date | null; // For storing the expiration date of the secret
  verificationStatus: VerificationStatus; // For storing the verification state of the user
  verificationAttempts: number; // For tracking the number of verification attempts
  verificationLockedUntil: Date | null; // For storing the date until the user is locked out of verification
}
