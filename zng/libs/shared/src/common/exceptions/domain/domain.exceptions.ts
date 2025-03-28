import { DomainExceptionCode } from './domain-exception.code';

export class DomainServiceException extends Error {
  constructor(public readonly message: string, public readonly errorCode: DomainExceptionCode = DomainExceptionCode.Undefined) {
    super(message);
    this.name = 'DomainServiceException';
  }
}

// #region Custom Exceptions implementations

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

export class UnexpectedRegistrationStatusException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.UnexpectedRegistrationStatus);
    this.name = 'UnexpectedRegistrationStatusException';
  }
}

export class ConfigurationVariableNotFoundException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.ConfigurationVariableNotFound);
    this.name = 'ConfigurationVariableNotFoundException';
  }
}

export class RegistrationSessionNotInitiatedException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.RegistrationSessionNotInitiated);
    this.name = 'RegistrationSessionNotInitiatedException';
  }
}

export class RegistrationSessionNotWaingForVerificationException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.RegistrationSessionNotWaingForVerification);
    this.name = 'RegistrationSessionNotWaingForVerificationException';
  }
}

export class RegistrationSecretNotFoundException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.RegistrationSecretNotFound);
    this.name = 'RegistrationSecretNotFoundException';
  }
}

export class RegistrationSecretExpiredException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.RegistrationSecretExpired);
    this.name = 'RegistrationSecretExpiredException';
  }
}

export class UnableToCreateLoginOnRegistrationException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.UnableToCreateLoginOnRegistration);
    this.name = 'UnableToCreateLoginOnRegistrationException';
  }
}

export class ContactTakenException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.ContactTaken);
    this.name = 'ContactTakenException';
  }
}

export class UnableToCreateUserException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.UnableToCreateUser);
    this.name = 'UnableToCreateUserException';
  }
}

export class RegistrationNotFoundException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.RegistrationNotFound);
    this.name = 'RegistrationNotFoundException';
  }
}

export class RegistrationProcessingFailedException extends DomainServiceException {
  constructor(message: string) {
    super(message, DomainExceptionCode.RegistrationProcessingFailed);
    this.name = 'RegistrationProcessingFailedException';
  }
}

// #endregion
