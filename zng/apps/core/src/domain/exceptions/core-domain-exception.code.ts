import { BaseDomainException } from '@library/shared/common/exceptions/domain/base-domain-exception.code';
import { HttpStatus } from '@nestjs/common';

export const CoreDomainExceptionCodes = {
  UserNotRegistered: 'user_not_registered',
  LoginSessionNotInitiated: 'login_session_not_initiated',
  LoginSessionExpired: 'login_session_expired',
  VerificationCodeMismatch: 'verification_code_mismatch',
  UnableToGenerateLoginPayload: 'unable_to_generate_login_payload',
  UnexpectedRegistrationStatus: 'unexpected_registration_status',
  LoginTemporaryLocked: 'login_temporary_locked',

  RegistrationSessionNotInitiated: 'registration_session_not_initiated',
  RegistrationSessionNotWaitingForVerification: 'registration_session_not_waiting_for_verification',
  RegistrationSecretNotFound: 'registration_secret_not_found',
  RegistrationSecretExpired: 'registration_secret_expired',
  RegistrationNotFound: 'registration_not_found',
  RegistrationProcessingFailed: 'registration_processing_failed',
  UnableToCreateLoginOnRegistration: 'unable_to_create_login_on_registration',
  ContactTaken: 'contact_taken',
  UnableToCreateUser: 'unable_to_create_user',
  WrongVerificationType: 'wrong_verification_type',
} as const;

export type CoreDomainExceptionCode = typeof CoreDomainExceptionCodes[keyof typeof CoreDomainExceptionCodes];

export class CoreDomainException extends BaseDomainException<CoreDomainExceptionCode> {
  constructor(code: CoreDomainExceptionCode, httpStatus: number = HttpStatus.BAD_REQUEST, message?: string) {
    super(code, 'core', httpStatus, message);
  }
}
