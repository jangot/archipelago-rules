import { MissingInputException } from '@library/shared/common/exception/domain';
import { LoanApplication } from '@library/shared/domain/entity/loan-application.entity';

export class LendingLogic {

  // #region Validation

  /**
   * Validates that a loan application has all required fields for acceptance.
   * Throws MissingInputException if any required field is missing.
   *
   * @param loanApplication - The loan application entity to validate
   * @todo TODO: What if just use `validate()` from `class-validator` against specific DTO?
   */
  public static validateLoanApplicationForAcceptance(loanApplication: LoanApplication): void {
    const requiredFields: string[] = [
      'loanAmount',
      'loanType',
      'lenderId',
      'borrowerId',
      'lenderPaymentAccountId',
      'borrowerPaymentAccountId',
      'loanPaymentFrequency',
      'loanPayments',
      'billerId',
      'billAccountNumber',
    ];
    const missingFields: string[] = requiredFields.filter(
      (field) => loanApplication[field as keyof LoanApplication] === null || loanApplication[field as keyof LoanApplication] === undefined
    );
    if (missingFields.length > 0) {
      throw new MissingInputException(
        `Loan application is missing required fields: ${missingFields.join(', ')}`
      );
    }
  }

  // #endregion
}
