import { LoanTypeCodes } from '@library/entity/enum';
import { Loan } from '@library/shared/domain/entity';
import { LoanApplication } from '@library/shared/domain/entity/loan-application.entity';
import { LoanCreateRequestDto } from './dto/request/loan.create.request.dto';
import { ActionNotAllowedException, BillerNotSelectedException } from './exceptions/loan-domain.exceptions';
import { MissingInputException } from '@library/shared/common/exception/domain';

export class LendingLogic {

  // #region Validation
  public static validateLoanCreateInput(input: LoanCreateRequestDto): void {
    const { billerId, type } = input;
    
    if (type !== LoanTypeCodes.Personal && !billerId) {
      throw new BillerNotSelectedException('No billerId provided for Bill Pay Loan');
    }
  }

  public static validateLoanProposeInput(userId: string, loan: Loan): void {
    const { lenderId } = loan;
    const canBeProposedBy = lenderId;

    if (canBeProposedBy !== userId) {
      throw new ActionNotAllowedException('Only lender can propose the loan offer');
    }
  }

  /**
   * Validates that a loan application has all required fields for acceptance.
   * Throws MissingInputException if any required field is missing.
   *
   * @param loanApplication - The loan application entity to validate
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
