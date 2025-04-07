import { RegistrationStatus } from '@library/entity/enum/registration.status';
import { VerificationStatus } from '@library/entity/enum/verification.status';
import { VerificationType } from '@library/entity/enum/verification.type';
import { IApplicationUser } from '@library/entity/interface';
import { Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn, CreateDateColumn } from 'typeorm';

// Thoughts to consider
// Should we add additional `normalized` versions of some of these fields to the Database?
// For example, we could add a `normalized` version of both the email and phoneNumber fields
// for the email field we could lower case the value and store it that way. It makes it easier to look up an email without considering casing
// We could also normalize the phone number the user entered by using the phone npm module and store it in a consistent format
// while also keeping the originally entered value
// Things to consider...
@Entity('users', { schema: 'core' })
export class ApplicationUser implements IApplicationUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: true })
  firstName: string | null;

  @Column('text', { nullable: true })
  lastName: string | null;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: string | null;

  @Column('text', { nullable: true, unique: false })
  pendingEmail: string | null;

  @Column('text', { nullable: true, unique: true })
  email: string | null;

  @Column('text', { nullable: true, unique: false })
  pendingPhoneNumber: string | null;

  @Column('text', { nullable: true, unique: true })
  phoneNumber: string | null;

  @DeleteDateColumn({ type: 'timestamp with time zone' })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @Column('text', { default: RegistrationStatus.NotRegistered })
  registrationStatus: RegistrationStatus;

  @Column('text', { nullable: true })
  onboardStatus: string | null;

  // Address fields
  @Column('text', { nullable: true })
  addressLine1: string | null;

  @Column('text', { nullable: true })
  addressLine2: string | null;

  @Column('text', { nullable: true })
  city: string | null;

  @Column('text', { nullable: true })
  state: string | null;

  @Column('text', { nullable: true })
  zipCode: string | null;

  // New fields related to login verification
  @Column('text', { nullable: true })
  verificationType: VerificationType | null;

  @Column('text', { nullable: true })
  secret: string | null;

  @Column('timestamp with time zone', { nullable: true })
  secretExpiresAt: Date | null; // For storing the expiration date of the secret

  @Column('text', { default: VerificationStatus.NotVerified })
  verificationStatus: VerificationStatus; // For storing the verification state of the user

  @Column('int', { default: 0 })
  verificationAttempts: number; // For tracking the number of verification attempts

  @Column('timestamp with time zone', { nullable: true })
  verificationLockedUntil: Date | null; // For storing the date until the user is locked out of verification
}
