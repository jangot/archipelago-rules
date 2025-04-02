import { HttpStatus } from '@nestjs/common';
import { DomainExceptionCode } from './domain-exception.code';

export class DomainServiceException extends Error {

  protected constructor(public readonly message: string, public readonly errorCode: DomainExceptionCode = DomainExceptionCode.Undefined, 
    public readonly httpStatus: number = HttpStatus.BAD_REQUEST) {
    super(message);
    this.name = 'DomainServiceException';
  }
}

// #region Custom Exceptions implementations

/**
 * HTTP NotFound(404) Exception thrown when an entity is not found.
 *
 * @extends DomainServiceException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 * @see {@link DomainServiceException}
 * 
 */
export class EntityNotFoundException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.EntityNotFound, HttpStatus.NOT_FOUND);
    this.name = 'EntityNotFoundException';
  }
}

/**
 * HTTP Unauthorized(401) Exception thrown when a required input is missing.
 *
 * @extends DomainServiceException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 * @see {@link DomainServiceException}
 * 
 */
export class UnauthorizedRequestException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.UnauthorizedRequest, HttpStatus.UNAUTHORIZED);
    this.name = 'UnauthorizedRequestException';
  }
}

/**
 * HTTP BadRequest(400) Exception thrown when a required input is missing.
 *
 * @extends DomainServiceException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 * @see {@link DomainServiceException}
 * 
 */
export class MissingInputException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.MissingInput, HttpStatus.BAD_REQUEST);
    this.name = 'MissingInputException';
  }
}

/**
 * HTTP Accepted(202) status when a User has not completed registration.
 *
 * @extends DomainServiceException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 * @see {@link DomainServiceException}
 * 
 */
export class UserNotRegisteredException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.UserNotRegistered, HttpStatus.ACCEPTED);
    this.name = 'UserNotRegisteredException';
  }
}

/**
 * HTTP BadRequest(400) Exception thrown when a User tries to verify a code using the wrong method (email, phonenumber).
 *
 * @extends DomainServiceException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 * @see {@link DomainServiceException}
 * 
 */
export class WrongVerificationTypeException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.WrongVerificationType, HttpStatus.BAD_REQUEST);
    this.name = 'WrongVerificationTypeException';
  }
}

/**
 * HTTP Forbidden(403) Exception thrown when a User has not initiated a Login session.
 *
 * @extends DomainServiceException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 * @see {@link DomainServiceException}
 * 
 */
export class LoginSessionNotInitiatedException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.LoginSessionNotInitiated, HttpStatus.FORBIDDEN);
    this.name = 'LoginSessionNotInitiatedException';
  }
}

/**
 * HTTP Forbidden(403) Exception thrown when a Login Verification code has expired.
 *
 * @extends DomainServiceException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 * @see {@link DomainServiceException}
 * 
 */
export class LoginSessionExpiredException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.LoginSessionExpired, HttpStatus.FORBIDDEN);
    this.name = 'LoginSessionExpiredException';
  }
}

/**
 * HTTP BadRequest(400) Exception thrown when the User entered Verification code does not match.
 *
 * @extends DomainServiceException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 * @see {@link DomainServiceException}
 * 
 */
export class VerificationCodeMismatchException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.VerificationCodeMismatch, HttpStatus.BAD_REQUEST);
    this.name = 'VerificationCodeMismatchException';
  }
}

/**
 * HTTP InternalServer(500) Exception thrown when we are unable to generate or store Login data.
 *
 * @extends DomainServiceException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 * @see {@link DomainServiceException}
 * 
 */
export class UnableToGenerateLoginPayloadException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.UnableToGenerateLoginPayload, HttpStatus.INTERNAL_SERVER_ERROR);
    this.name = 'UnableToGenerateLoginPayloadException';
  }
}

/**
 * HTTP InternalServer(500) Exception thrown when a User is not in a state to complete verification.
 *
 * @extends DomainServiceException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 * @see {@link DomainServiceException}
 * 
 */
export class UnexpectedRegistrationStatusException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.UnexpectedRegistrationStatus, HttpStatus.INTERNAL_SERVER_ERROR);
    this.name = 'UnexpectedRegistrationStatusException';
  }
}

/**
 * HTTP InternalServer(500) Exception thrown when we are unable to retrieve a needed Config variable.
 *
 * @extends DomainServiceException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 * @see {@link DomainServiceException}
 * 
 */
export class ConfigurationVariableNotFoundException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.ConfigurationVariableNotFound, HttpStatus.INTERNAL_SERVER_ERROR);
    this.name = 'ConfigurationVariableNotFoundException';
  }
}

/**
 * HTTP BadRequest(400) Exception thrown when No registration found for user.
 *
 * @extends DomainServiceException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 * @see {@link DomainServiceException}
 * 
 */
export class RegistrationSessionNotInitiatedException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.RegistrationSessionNotInitiated, HttpStatus.BAD_REQUEST);
    this.name = 'RegistrationSessionNotInitiatedException';
  }
}

/**
 * HTTP BadRequest(400) Exception thrown when User is not waiting for code verification.
 *
 * @extends DomainServiceException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 * @see {@link DomainServiceException}
 * 
 */
export class RegistrationSessionNotWaingForVerificationException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.RegistrationSessionNotWaitingForVerification, HttpStatus.BAD_REQUEST);
    this.name = 'RegistrationSessionNotWaingForVerificationException';
  }
}

/**
 * HTTP NotFound(404) Exception thrown when No secret found for user.
 *
 * @extends DomainServiceException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 * @see {@link DomainServiceException}
 * 
 */
export class RegistrationSecretNotFoundException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.RegistrationSecretNotFound, HttpStatus.NOT_FOUND);
    this.name = 'RegistrationSecretNotFoundException';
  }
}

/**
 * HTTP BadRequest(400) Exception thrown when Secret expired for user.
 *
 * @extends DomainServiceException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 * @see {@link DomainServiceException}
 * 
 */

export class RegistrationSecretExpiredException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.RegistrationSecretExpired, HttpStatus.BAD_REQUEST);
    this.name = 'RegistrationSecretExpiredException';
  }
}

/**
 * HTTP InternalServer(500) Exception thrown when we Failed to create login for user.
 *
 * @extends DomainServiceException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 * @see {@link DomainServiceException}
 * 
 */
export class UnableToCreateLoginOnRegistrationException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.UnableToCreateLoginOnRegistration, HttpStatus.INTERNAL_SERVER_ERROR);
    this.name = 'UnableToCreateLoginOnRegistrationException';
  }
}

/**
 * HTTP BadRequest(400) Exception thrown when Email/Phonenumber already taken.
 *
 * @extends DomainServiceException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 * @see {@link DomainServiceException}
 * 
 */
export class ContactTakenException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.ContactTaken, HttpStatus.BAD_REQUEST);
    this.name = 'ContactTakenException';
  }
}

/**
 * HTTP InternalServer(500) Exception thrown when we Failed to create user.
 *
 * @extends DomainServiceException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 * @see {@link DomainServiceException}
 * 
 */
export class UnableToCreateUserException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.UnableToCreateUser, HttpStatus.INTERNAL_SERVER_ERROR);
    this.name = 'UnableToCreateUserException';
  }
}

/**
 * HTTP NotFound(404) Exception thrown when No registration found for user.
 *
 * @extends DomainServiceException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 * @see {@link DomainServiceException}
 * 
 */
export class RegistrationNotFoundException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.RegistrationNotFound, HttpStatus.NOT_FOUND);
    this.name = 'RegistrationNotFoundException';
  }
}

/**
 * HTTP InternalServer(500) Exception thrown when Registration or Registration Verification failed.
 *
 * @extends DomainServiceException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 * @see {@link DomainServiceException}
 * 
 */
export class RegistrationProcessingFailedException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.RegistrationProcessingFailed, HttpStatus.INTERNAL_SERVER_ERROR);
    this.name = 'RegistrationProcessingFailedException';
  }
}
// #endregion
