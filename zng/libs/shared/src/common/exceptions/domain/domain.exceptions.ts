import { DomainExceptionCode } from './domain-exception.code';

export class DomainServiceException extends Error {
  constructor(public readonly message: string, public readonly errorCode: DomainExceptionCode = DomainExceptionCode.Undefined) {
    super(message);
    this.name = 'DomainServiceException';
  }
}

// #region Custom Expections implementations

export class EntityNotFoundException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.EntityNotFound);
    this.name = 'EntityNotFoundException';
  }
}

export class UnauthorizedRequestException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.UnauthorizedRequest);
    this.name = 'UnauthorizedRequestException';
  }
}

export class MissingInputException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.MissingInput);
    this.name = 'MissingInputException';
  }
}

export class UserNotRegisteredException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.UserNotRegistered);
    this.name = 'UserNotRegisteredException';
  }
}

export class LoginSessionNotInitiatedException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.LoginSessionNotInitiated);
    this.name = 'LoginSessionNotInitiatedException';
  }
}

export class LoginSessionExpiredException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.LoginSessionExpired);
    this.name = 'LoginSessionExpiredException';
  }
}

export class VerificationCodeMismatchException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.VerificationCodeMismatch);
    this.name = 'VerificationCodeMismatchException';
  }
}

export class UnableToGenerateLoginPayloadException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.UnableToGenerateLoginPayload);
    this.name = 'UnableToGenerateLoginPayloadException';
  }
}

// #endregion
