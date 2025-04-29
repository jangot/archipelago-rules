import { ILoan } from '@library/entity/interface';
import { LendingBaseCommandHandler } from './lending.base.command-handler';
import { LoanProposeCommand } from './lending.commands';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EntityFailedToUpdateException, EntityNotFoundException } from '@library/shared/common/exceptions/domain';
import { ActionNotAllowedException } from '@core/domain/exceptions/loan-domain.exceptions';
import { LoanInviteeTypeCodes, LoanStateCodes } from '@library/entity/enum';
import { DeepPartial } from 'typeorm';

@CommandHandler(LoanProposeCommand)
export class LoanProposeCommandHandler 
  extends LendingBaseCommandHandler<LoanProposeCommand, ILoan | null>
  implements ICommandHandler<LoanProposeCommand> {

  public async execute(command: LoanProposeCommand): Promise<ILoan | null> {
    const { payload: { userId, loanId, sourcePaymentAccountId } } = command;

    const loan = await this.loadLoan(loanId);
    const { lenderId, borrowerId, invitee } = loan;
    const isInviteeBorrower = invitee.type === LoanInviteeTypeCodes.Borrower;
    const canBeProposedBy = isInviteeBorrower ? lenderId : borrowerId;

    if (canBeProposedBy !== userId) {
      throw new ActionNotAllowedException(`Only ${isInviteeBorrower ? 'lender' : 'borrower'} can propose the loan ${isInviteeBorrower ? 'offer' : 'request'}`);
    }

    const paymentAccount = await this.domainServices.paymentServices.getPaymentAccountById(sourcePaymentAccountId);
    if (!paymentAccount) {
      throw new EntityNotFoundException('Payment account not found');
    }
    if (paymentAccount.ownerId !== userId) {
      throw new ActionNotAllowedException('Payment account does not belong to the user');
    }

    // TODO: Add Payment Account state validation (e.g. not verified yet)

    const updates: DeepPartial<ILoan> = {};
    if (isInviteeBorrower) {
      updates.lenderAccountId = paymentAccount.id;
      updates.state = LoanStateCodes.Offered;
    } else {
      updates.borrowerAccountId = paymentAccount.id;
      updates.state = LoanStateCodes.Requested;
    }

    const updateResult = await this.domainServices.loanServices.updateLoan(loan.id, updates);
    if (!updateResult) {
      throw new EntityFailedToUpdateException('Failed to update loan');
    }

    return this.loadLoan(loanId);
  }
}
