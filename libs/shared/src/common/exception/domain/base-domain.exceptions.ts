import { BaseDomainExceptionCode, BaseDomainException, BaseDomainExceptionCodes } from './base-domain-exception.code';
import { HttpStatus } from '@nestjs/common';
/**
 * HTTP NotFound(404) Exception thrown when an entity is not found.
 *
 * @extends BaseDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class EntityNotFoundException extends BaseDomainException<BaseDomainExceptionCode> {
  constructor(message?: string) {
    super(BaseDomainExceptionCodes.EntityNotFound, 'base', HttpStatus.NOT_FOUND, message);
  }
}

/**
 * HTTP Unauthorized(401) Exception thrown when a required input is missing.
 *
 * @extends BaseDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class UnauthorizedRequestException extends BaseDomainException<BaseDomainExceptionCode> {
  constructor(message?: string) {
    super(BaseDomainExceptionCodes.UnauthorizedRequest, 'base', HttpStatus.UNAUTHORIZED, message);
  }
}

/**
 * HTTP BadRequest(400) Exception thrown when a required input is missing.
 *
 * @extends BaseDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class MissingInputException extends BaseDomainException<BaseDomainExceptionCode> {
  constructor(message?: string) {
    super(BaseDomainExceptionCodes.MissingInput, 'base', HttpStatus.BAD_REQUEST, message);
  }
}

/**
 * HTTP InternalServer(500) Exception thrown when we are unable to retrieve a needed Config variable.
 *
 * @extends BaseDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class ConfigurationVariableNotFoundException extends BaseDomainException<BaseDomainExceptionCode> {
  constructor(message?: string) {
    super(BaseDomainExceptionCodes.ConfigurationVariableNotFound, 'base', HttpStatus.INTERNAL_SERVER_ERROR, message);
  }
} 

/**
 * HTTP InternalServer(500) Exception thrown when an entity fails to update.
 *
 * @extends BaseDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class EntityFailedToUpdateException extends BaseDomainException<BaseDomainExceptionCode> {
  constructor(message?: string) {
    super(BaseDomainExceptionCodes.EntityFailedToUpdate, 'base', HttpStatus.INTERNAL_SERVER_ERROR, message);
  }
}
