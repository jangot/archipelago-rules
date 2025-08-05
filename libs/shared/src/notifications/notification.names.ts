// Notification Definitions and grouping

/**
 * Notification names for authentication.
 * 
 * @description
 * These are the names of the notifications that are used to send verification codes to users,
 * for both login and registration.
 * 
 * @example
 * const notificationName = AuthNotificationNames.LoginVerificationSMS;
 * 
*/
export const AuthNotificationNames = {
  LoginVerificationSMS: 'login_verification_sms',
  LoginVerificationEmail: 'login_verification_email',
  RegistrationVerificationSMS: 'registration_verification_sms',
  RegistrationVerificationEmail: 'registration_verification_email',
} as const;

/**
 * Notification names for loan.
 * 
 * @description
 * These are the names of the notifications that are used to send loan application expiration reminders to users.
 * 
*/
export const LoanNotificationNames = {
  LoanApplicationExpirationPending: 'loan_application_expiration_pending',
  LoanApplicationExpirationExpired: 'loan_application_expiration_expired',
} as const;

export type AuthNotificationNameType = (typeof AuthNotificationNames)[keyof typeof AuthNotificationNames];
export type LoanNotificationNameType = (typeof LoanNotificationNames)[keyof typeof LoanNotificationNames];

export type NotificationNameType = AuthNotificationNameType | LoanNotificationNameType;
