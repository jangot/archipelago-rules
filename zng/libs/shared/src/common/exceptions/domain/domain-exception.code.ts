export enum DomainExceptionCode {
  EntityNotFound = 'entity_not_found',
  UnathorizedRequest = 'unauthorized_request',
  MissingInput = 'missing_input',
  UserNotRegistered = 'user_not_registered',
  LoginSessionNotInitiated = 'login_session_not_initiated',
  LoginSessionExpired = 'login_session_expired',
  VerificationCodeMismatch = 'verification_code_mismatch',
  UnableToGenerateLoginPayload = 'unable_to_generate_login_payload',    
}
