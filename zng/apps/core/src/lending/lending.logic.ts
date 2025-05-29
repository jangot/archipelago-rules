import { ActionNotAllowedException, BillerNotSelectedException } from '@core/domain/exceptions/loan-domain.exceptions';
import { LoanCreateRequestDto } from '@core/dto';
import { LoanInviteeTypeCodes, LoanTypeCodes } from '@library/entity/enum';
import { ILoan } from '@library/entity/interface';
import { MissingInputException } from '@library/shared/common/exceptions/domain';

export class LendingLogic {

  // #region Validation
  public static validateLoanCreateInput(input: LoanCreateRequestDto): void {
    const { billerId, type, invitee } = input;
    
    // Check Loan Invitee data provided
    if (!invitee || !invitee.type || !invitee.email || !invitee.phone) {
      throw new MissingInputException('Loan Invitee details missing');
    }

    if (type !== LoanTypeCodes.Personal && !billerId) {
      throw new BillerNotSelectedException('No billerId provided for Bill Pay Loan');
    }
  }

  public static validateLoanProposeInput(userId: string, loan: ILoan): void {
    const { lenderId, borrowerId, invitee } = loan;
    const isInviteeBorrower = invitee.type === LoanInviteeTypeCodes.Borrower;
    const canBeProposedBy = isInviteeBorrower ? lenderId : borrowerId;

    if (canBeProposedBy !== userId) {
      throw new ActionNotAllowedException(`Only ${isInviteeBorrower ? 'lender' : 'borrower'} can propose the loan ${isInviteeBorrower ? 'offer' : 'request'}`);
    }
  }

  // #endregion
}
