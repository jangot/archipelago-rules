import { BaseDomainException } from '@library/shared/common/exception/domain';
import { HttpStatus } from '@nestjs/common';

export const LoanDomainExceptionCodes = {
  BillerNotSelected: 'biller_not_selected',
  UnableToCreatePersonalBiller: 'unable_to_create_personal_biller',
  ActionNotAllowed: 'action_not_allowed',
  ActionNotSupportedForState: 'action_not_supported_for_state',
} as const;

export type LoanDomainExcetionCode = typeof LoanDomainExceptionCodes[keyof typeof LoanDomainExceptionCodes];

export class LoanDomainException extends BaseDomainException<LoanDomainExcetionCode> {
  constructor(code: LoanDomainExcetionCode, httpStatus: number = HttpStatus.BAD_REQUEST, message?: string) {
    super(code, 'loan', httpStatus, message);
  }
}
