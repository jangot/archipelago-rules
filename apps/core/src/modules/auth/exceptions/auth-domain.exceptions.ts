import { AuthDomainException, AuthDomainExceptionCodes } from './auth-domain-exception.code';
import { HttpStatus } from '@nestjs/common';
/**
 * HTTP Accepted(202) status when a User has not completed registration.
 *
 * @extends AuthDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class UserNotRegisteredException extends AuthDomainException {
  constructor(message?: string) {
    super(AuthDomainExceptionCodes.UserNotRegistered, HttpStatus.ACCEPTED, message);
  }
}

/**
 * HTTP Forbidden(403) Exception thrown when a User has not initiated a Login session.
 *
 * @extends AuthDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class LoginSessionNotInitiatedException extends AuthDomainException {
  constructor(message?: string) {
    super(AuthDomainExceptionCodes.LoginSessionNotInitiated, HttpStatus.FORBIDDEN, message);
  }
}

/**
 * HTTP Forbidden(403) Exception thrown when a Login Verification code has expired.
 *
 * @extends AuthDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class LoginSessionExpiredException extends AuthDomainException {
  constructor(message?: string) {
    super(AuthDomainExceptionCodes.LoginSessionExpired, HttpStatus.FORBIDDEN, message);
  }
}

/**
 * HTTP BadRequest(400) Exception thrown when the User entered Verification code does not match.
 *
 * @extends AuthDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class VerificationCodeMismatchException extends AuthDomainException {
  constructor(message?: string) {
    super(AuthDomainExceptionCodes.VerificationCodeMismatch, HttpStatus.BAD_REQUEST, message);
  }
}

/**
 * HTTP InternalServer(500) Exception thrown when we are unable to generate or store Login data.
 *
 * @extends AuthDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class UnableToGenerateLoginPayloadException extends AuthDomainException {
  constructor(message?: string) {
    super(AuthDomainExceptionCodes.UnableToGenerateLoginPayload, HttpStatus.INTERNAL_SERVER_ERROR, message);
  }
}

/**
 * HTTP InternalServer(500) Exception thrown when a User is not in a state to complete verification.
 *
 * @extends AuthDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class UnexpectedRegistrationStatusException extends AuthDomainException {
  constructor(message?: string) {
    super(AuthDomainExceptionCodes.UnexpectedRegistrationStatus, HttpStatus.INTERNAL_SERVER_ERROR, message);
  }
}

/**
 * HTTP Forbidden(403) Exception thrown when a login is temporarily locked.
 *
 * @extends AuthDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class LoginTemporaryLockedException extends AuthDomainException {
  constructor(message?: string) {
    super(AuthDomainExceptionCodes.LoginTemporaryLocked, HttpStatus.FORBIDDEN, message);
  }
}

/**
 * HTTP BadRequest(400) Exception thrown when No registration found for user.
 *
 * @extends AuthDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class RegistrationSessionNotInitiatedException extends AuthDomainException {
  constructor(message?: string) {
    super(AuthDomainExceptionCodes.RegistrationSessionNotInitiated, HttpStatus.BAD_REQUEST, message);
  }
}

/**
 * HTTP BadRequest(400) Exception thrown when User is not waiting for code verification.
 *
 * @extends AuthDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class RegistrationSessionNotWaitingForVerificationException extends AuthDomainException {
  constructor(message?: string) {
    super(AuthDomainExceptionCodes.RegistrationSessionNotWaitingForVerification, HttpStatus.BAD_REQUEST, message);
  }
}

/**
 * HTTP NotFound(404) Exception thrown when No secret found for user.
 *
 * @extends AuthDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class RegistrationSecretNotFoundException extends AuthDomainException {
  constructor(message?: string) {
    super(AuthDomainExceptionCodes.RegistrationSecretNotFound, HttpStatus.NOT_FOUND, message);
  }
}

/**
 * HTTP BadRequest(400) Exception thrown when Secret expired for user.
 *
 * @extends AuthDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class RegistrationSecretExpiredException extends AuthDomainException {
  constructor(message?: string) {
    super(AuthDomainExceptionCodes.RegistrationSecretExpired, HttpStatus.BAD_REQUEST, message);
  }
}

/**
 * HTTP NotFound(404) Exception thrown when registration not found.
 *
 * @extends AuthDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class RegistrationNotFoundException extends AuthDomainException {
  constructor(message?: string) {
    super(AuthDomainExceptionCodes.RegistrationNotFound, HttpStatus.NOT_FOUND, message);
  }
}

/**
 * HTTP InternalServer(500) Exception thrown when registration processing failed.
 *
 * @extends AuthDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class RegistrationProcessingFailedException extends AuthDomainException {
  constructor(message?: string) {
    super(AuthDomainExceptionCodes.RegistrationProcessingFailed, HttpStatus.INTERNAL_SERVER_ERROR, message);
  }
}

/**
 * HTTP InternalServer(500) Exception thrown when we Failed to create login for user.
 *
 * @extends AuthDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class UnableToCreateLoginOnRegistrationException extends AuthDomainException {
  constructor(message?: string) {
    super(AuthDomainExceptionCodes.UnableToCreateLoginOnRegistration, HttpStatus.INTERNAL_SERVER_ERROR, message);
  }
}

/**
 * HTTP Conflict(409) Exception thrown when contact is already taken.
 *
 * @extends AuthDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class ContactTakenException extends AuthDomainException {
  constructor(message?: string) {
    super(AuthDomainExceptionCodes.ContactTaken, HttpStatus.CONFLICT, message);
  }
}

/**
 * HTTP InternalServer(500) Exception thrown when unable to create user.
 *
 * @extends AuthDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class UnableToCreateUserException extends AuthDomainException {
  constructor(message?: string) {
    super(AuthDomainExceptionCodes.UnableToCreateUser, HttpStatus.INTERNAL_SERVER_ERROR, message);
  }
}

/**
 * HTTP BadRequest(400) Exception thrown when a User tries to verify a code using the wrong method (email, phonenumber).
 *
 * @extends AuthDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class WrongVerificationTypeException extends AuthDomainException {
  constructor(message?: string) {
    super(AuthDomainExceptionCodes.WrongVerificationType, HttpStatus.BAD_REQUEST, message);
  }
} // Add other auth-specific exceptions... 
