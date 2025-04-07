import { CoreDomainException, CoreDomainExceptionCodes } from './core-domain-exception.code';
import { HttpStatus } from '@nestjs/common';
/**
 * HTTP Accepted(202) status when a User has not completed registration.
 *
 * @extends CoreDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class UserNotRegisteredException extends CoreDomainException {
  constructor(message?: string) {
    super(CoreDomainExceptionCodes.UserNotRegistered, HttpStatus.ACCEPTED, message);
  }
}

/**
 * HTTP Forbidden(403) Exception thrown when a User has not initiated a Login session.
 *
 * @extends CoreDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class LoginSessionNotInitiatedException extends CoreDomainException {
  constructor(message?: string) {
    super(CoreDomainExceptionCodes.LoginSessionNotInitiated, HttpStatus.FORBIDDEN, message);
  }
}

/**
 * HTTP Forbidden(403) Exception thrown when a Login Verification code has expired.
 *
 * @extends CoreDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class LoginSessionExpiredException extends CoreDomainException {
  constructor(message?: string) {
    super(CoreDomainExceptionCodes.LoginSessionExpired, HttpStatus.FORBIDDEN, message);
  }
}

/**
 * HTTP BadRequest(400) Exception thrown when the User entered Verification code does not match.
 *
 * @extends CoreDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class VerificationCodeMismatchException extends CoreDomainException {
  constructor(message?: string) {
    super(CoreDomainExceptionCodes.VerificationCodeMismatch, HttpStatus.BAD_REQUEST, message);
  }
}

/**
 * HTTP InternalServer(500) Exception thrown when we are unable to generate or store Login data.
 *
 * @extends CoreDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class UnableToGenerateLoginPayloadException extends CoreDomainException {
  constructor(message?: string) {
    super(CoreDomainExceptionCodes.UnableToGenerateLoginPayload, HttpStatus.INTERNAL_SERVER_ERROR, message);
  }
}

/**
 * HTTP InternalServer(500) Exception thrown when a User is not in a state to complete verification.
 *
 * @extends CoreDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class UnexpectedRegistrationStatusException extends CoreDomainException {
  constructor(message?: string) {
    super(CoreDomainExceptionCodes.UnexpectedRegistrationStatus, HttpStatus.INTERNAL_SERVER_ERROR, message);
  }
}

/**
 * HTTP Forbidden(403) Exception thrown when a login is temporarily locked.
 *
 * @extends CoreDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class LoginTemporaryLockedException extends CoreDomainException {
  constructor(message?: string) {
    super(CoreDomainExceptionCodes.LoginTemporaryLocked, HttpStatus.FORBIDDEN, message);
  }
}

/**
 * HTTP BadRequest(400) Exception thrown when No registration found for user.
 *
 * @extends CoreDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class RegistrationSessionNotInitiatedException extends CoreDomainException {
  constructor(message?: string) {
    super(CoreDomainExceptionCodes.RegistrationSessionNotInitiated, HttpStatus.BAD_REQUEST, message);
  }
}

/**
 * HTTP BadRequest(400) Exception thrown when User is not waiting for code verification.
 *
 * @extends CoreDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class RegistrationSessionNotWaitingForVerificationException extends CoreDomainException {
  constructor(message?: string) {
    super(CoreDomainExceptionCodes.RegistrationSessionNotWaitingForVerification, HttpStatus.BAD_REQUEST, message);
  }
}

/**
 * HTTP NotFound(404) Exception thrown when No secret found for user.
 *
 * @extends CoreDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class RegistrationSecretNotFoundException extends CoreDomainException {
  constructor(message?: string) {
    super(CoreDomainExceptionCodes.RegistrationSecretNotFound, HttpStatus.NOT_FOUND, message);
  }
}

/**
 * HTTP BadRequest(400) Exception thrown when Secret expired for user.
 *
 * @extends CoreDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class RegistrationSecretExpiredException extends CoreDomainException {
  constructor(message?: string) {
    super(CoreDomainExceptionCodes.RegistrationSecretExpired, HttpStatus.BAD_REQUEST, message);
  }
}

/**
 * HTTP NotFound(404) Exception thrown when registration not found.
 *
 * @extends CoreDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class RegistrationNotFoundException extends CoreDomainException {
  constructor(message?: string) {
    super(CoreDomainExceptionCodes.RegistrationNotFound, HttpStatus.NOT_FOUND, message);
  }
}

/**
 * HTTP InternalServer(500) Exception thrown when registration processing failed.
 *
 * @extends CoreDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class RegistrationProcessingFailedException extends CoreDomainException {
  constructor(message?: string) {
    super(CoreDomainExceptionCodes.RegistrationProcessingFailed, HttpStatus.INTERNAL_SERVER_ERROR, message);
  }
}

/**
 * HTTP InternalServer(500) Exception thrown when we Failed to create login for user.
 *
 * @extends CoreDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class UnableToCreateLoginOnRegistrationException extends CoreDomainException {
  constructor(message?: string) {
    super(CoreDomainExceptionCodes.UnableToCreateLoginOnRegistration, HttpStatus.INTERNAL_SERVER_ERROR, message);
  }
}

/**
 * HTTP Conflict(409) Exception thrown when contact is already taken.
 *
 * @extends CoreDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class ContactTakenException extends CoreDomainException {
  constructor(message?: string) {
    super(CoreDomainExceptionCodes.ContactTaken, HttpStatus.CONFLICT, message);
  }
}

/**
 * HTTP InternalServer(500) Exception thrown when unable to create user.
 *
 * @extends CoreDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class UnableToCreateUserException extends CoreDomainException {
  constructor(message?: string) {
    super(CoreDomainExceptionCodes.UnableToCreateUser, HttpStatus.INTERNAL_SERVER_ERROR, message);
  }
}

/**
 * HTTP BadRequest(400) Exception thrown when a User tries to verify a code using the wrong method (email, phonenumber).
 *
 * @extends CoreDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class WrongVerificationTypeException extends CoreDomainException {
  constructor(message?: string) {
    super(CoreDomainExceptionCodes.WrongVerificationType, HttpStatus.BAD_REQUEST, message);
  }
} // Add other auth-specific exceptions... 
