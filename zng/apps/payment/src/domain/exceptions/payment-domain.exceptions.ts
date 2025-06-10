import { HttpStatus } from '@nestjs/common';
import { PaymentDomainException, PaymentDomainExceptionCodes } from './payment-domain-exception.code';

/**
 * HTTP InternalServerError(500) Exception thrown when the state of a payment step is out of sync.
 */
export class PaymentStepStateIsOutOfSyncException extends PaymentDomainException {
  constructor(message?: string) {
    super(PaymentDomainExceptionCodes.PaymentStepStateIsOutOfSync, HttpStatus.INTERNAL_SERVER_ERROR, message);
  }
}
