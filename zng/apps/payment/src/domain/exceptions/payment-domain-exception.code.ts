import { BaseDomainException } from '@library/shared/common/exceptions/domain';
import { HttpStatus } from '@nestjs/common';

export const PaymentDomainExceptionCodes = {
  PaymentStepStateIsOutOfSync: 'payment_step_state_is_out_of_sync',
} as const;

export type PaymentDomainExceptionCode = (typeof PaymentDomainExceptionCodes)[keyof typeof PaymentDomainExceptionCodes];

export class PaymentDomainException extends BaseDomainException<PaymentDomainExceptionCode> {
  constructor(code: PaymentDomainExceptionCode, httpStatus: number = HttpStatus.BAD_REQUEST, message?: string) {
    super(code, 'payment', httpStatus, message);
  }
}
