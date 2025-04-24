import { HttpStatus } from '@nestjs/common';
import { LoanDomainException, LoanDomainExceptionCodes } from './loan-domain-exception.code';

/**
 * HTTP BadRequest(400) Exception thrown when a Biller has not been selected.
 * 
 * @extends LoanDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class BillerNotSelectedException extends LoanDomainException {
  constructor(message?: string) {
    super(LoanDomainExceptionCodes.BillerNotSelected, HttpStatus.BAD_REQUEST, message);
  }
}

/**
 * HTTP InternalServerError(500) Exception thrown when unable to create a personal Biller.
 * 
 * @extends LoanDomainException
 * @see {@link https://docs.nestjs.com/exception-filters#built-in-http-exceptions}
 */
export class UnableToCreatePersonalBillerException extends LoanDomainException {
  constructor(message?: string) {
    super(LoanDomainExceptionCodes.UnableToCreatePersonalBiller, HttpStatus.INTERNAL_SERVER_ERROR, message);
  }
}
