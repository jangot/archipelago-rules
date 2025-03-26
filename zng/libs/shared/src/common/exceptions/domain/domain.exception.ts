import { DomainExceptionCode } from './domain-exception.code';

export class DomainServiceException extends Error {
  private code?: DomainExceptionCode;

  constructor(public readonly message: string, public readonly errorCode?: DomainExceptionCode) {
    super(message);
    this.name = 'DomainServiceException';
    this.code = errorCode;
  }
}

// #region Custom Expections implementations

export class EntityNotFoundException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.EntityNotFound);
  }
}

export class UnathorizedRequestException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.UnathorizedRequest);
  }
}

export class MissingInputException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.MissingInput);
  }
}

export class UserNotRegisteredException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.UserNotRegistered);
  }
}

export class LoginSessionNotInitiatedException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.LoginSessionNotInitiated);
  }
}

export class LoginSessionExpiredException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.LoginSessionExpired);
  }
}

export class VerificationCodeMismatchException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.VerificationCodeMismatch);
  }
}

export class UnableToGenerateLoginPayloadException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.UnableToGenerateLoginPayload);
  }
}

// #endregion
