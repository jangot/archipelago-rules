import { ILoan } from '@library/entity/interface';
import { LendingBaseCommandHandler } from './lending.base.command-handler';
import { LoanProposeCommand } from './lending.commands';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EntityFailedToUpdateException, EntityNotFoundException } from '@library/shared/common/exceptions/domain';
import { ActionNotAllowedException } from '@core/domain/exceptions/loan-domain.exceptions';
import { LoanStateCodes } from '@library/entity/enum';

@CommandHandler(LoanProposeCommand)
export class LoanProposeCommandHandler 
  extends LendingBaseCommandHandler<LoanProposeCommand, ILoan | null>
  implements ICommandHandler<LoanProposeCommand> {

  public async execute(command: LoanProposeCommand): Promise<ILoan | null> {
    const { payload: { userId, loanId, sourcePaymentAccountId } } = command;

    const loan = await this.loadLoan(loanId);
    const { lenderId, borrowerId, isLendLoan } = loan;
    const canBeProposedBy = isLendLoan ? lenderId : borrowerId;

    if (canBeProposedBy !== userId) {
      throw new ActionNotAllowedException(`Only ${isLendLoan ? 'lender' : 'borrower'} can propose the loan ${isLendLoan ? 'offer' : 'request'}`);
    }

    const paymentAccount = await this.domainServices.paymentServices.getPaymentAccountById(sourcePaymentAccountId);
    if (!paymentAccount) {
      throw new EntityNotFoundException('Payment account not found');
    }
    if (paymentAccount.ownerId !== userId) {
      throw new ActionNotAllowedException('Payment account does not belong to the user');
    }

    // TODO: Add Payment Account state validation (e.g. not verified yet)

    if (isLendLoan) {
      loan.lenderAccountId = paymentAccount.id;
      loan.state = LoanStateCodes.Offered;
    } else {
      loan.borrowerAccountId = paymentAccount.id;
      loan.state = LoanStateCodes.Requested;
    }

    const updateResult = await this.domainServices.loanServices.updateLoan(loan);
    if (!updateResult) {
      throw new EntityFailedToUpdateException('Failed to update loan');
    }

    return this.loadLoan(loanId);
  }
}
