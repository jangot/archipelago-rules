import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoanCreateCommand } from './lending.commands';
import { LendingBaseCommandHandler } from './lending.base.command-handler';
import { ILoan } from '@library/entity/interface';
import { LoanInviteeTypeCodes, LoanTypeCodes } from '@library/entity/enum';
import { BillerNotSelectedException, UnableToCreatePersonalBillerException } from '@core/domain/exceptions/loan-domain.exceptions';
import { DeepPartial } from 'typeorm';
import { MissingInputException } from '@library/shared/common/exceptions/domain';

@CommandHandler(LoanCreateCommand)
export class LoanCreateCommandHandler 
  extends LendingBaseCommandHandler<LoanCreateCommand, ILoan | null> 
  implements ICommandHandler<LoanCreateCommand> {
    
  public async execute(command: LoanCreateCommand): Promise<ILoan | null> {
    const { payload } = command;
    const { userId: creatorId, billerId, type, invitee } = payload;
    const loanCreateInput: DeepPartial<ILoan> = { ...payload };

    // Check Loan Invitee data provided
    if (!invitee || !invitee.type || !invitee.email || !invitee.phone) {
      throw new MissingInputException('Loan Invitee details missing');
    }
    const { type: inviteeType } = invitee;

    // Check Biller - create personal if P2P, otherwise if empty - throw

    if (type !== LoanTypeCodes.Personal && !billerId) {
      this.logger.warn(`LoanCreateCommand: No billerId provided for loan type: ${type}`);
      throw new BillerNotSelectedException('No billerId provided for Bill Pay Loan');
    }

    if (type === LoanTypeCodes.Personal) {
      const personalBiller = await this.domainServices.loanServices.createPersonalBiller(loanCreateInput, creatorId);
      if (!personalBiller) {
        this.logger.error('LoanCreateCommand: Failed to create personal Biller', { payload });
        throw new UnableToCreatePersonalBillerException('Failed to create personal biller');
      }
      loanCreateInput.billerId = personalBiller.id;
    }
    // TODO billingAccountNumebr validation here?

    // Link user to lender/borrower
    if (inviteeType === LoanInviteeTypeCodes.Borrower) {
      loanCreateInput.lenderId = creatorId;
    } else if (inviteeType === LoanInviteeTypeCodes.Lender) {
      loanCreateInput.borrowerId = creatorId;
    }

    // etc

    return this.domainServices.loanServices.createLoan(loanCreateInput);
  }
}
