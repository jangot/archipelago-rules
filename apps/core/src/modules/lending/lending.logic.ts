import { ActionNotAllowedException, BillerNotSelectedException } from './exceptions/loan-domain.exceptions';
import { LoanCreateRequestDto } from './dto/request/loan.create.request.dto';
import { LoanTypeCodes } from '@library/entity/enum';
import { ILoan } from '@library/entity/entity-interface';

export class LendingLogic {

  // #region Validation
  public static validateLoanCreateInput(input: LoanCreateRequestDto): void {
    const { billerId, type } = input;
    
    if (type !== LoanTypeCodes.Personal && !billerId) {
      throw new BillerNotSelectedException('No billerId provided for Bill Pay Loan');
    }
  }

  public static validateLoanProposeInput(userId: string, loan: ILoan): void {
    const { lenderId } = loan;
    const canBeProposedBy = lenderId;

    if (canBeProposedBy !== userId) {
      throw new ActionNotAllowedException('Only lender can propose the loan offer');
    }
  }

  // #endregion
}
