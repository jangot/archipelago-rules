import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoanCreateCommand } from './lending.commands';
import { LendingBaseCommandHandler } from './lending.base.command-handler';
import { ILoan } from '@library/entity/interface';
import { LoanTypeCodes } from '@library/entity/enum';
import { BillerNotSelectedException, UnableToCreatePersonalBillerException } from '@core/domain/exceptions/loan-domain.exceptions';
import { DeepPartial } from 'typeorm';

@CommandHandler(LoanCreateCommand)
export class LoanCreateCommandHandler 
  extends LendingBaseCommandHandler<LoanCreateCommand, ILoan | null> 
  implements ICommandHandler<LoanCreateCommand> {
  public async execute(command: LoanCreateCommand): Promise<ILoan | null> {
    const { payload } = command;
    const { userId: creatorId, billerId, type, isLendLoan } = payload;
    const loanCreateInput: DeepPartial<ILoan> = { ...payload };

    // Check Biller - create personal if P2P, otherwise if empty - throw

    if (type !== LoanTypeCodes.Personal && !billerId) {
      this.logger.warn(`LoanCreateCommand: No billerId provided for loan type: ${type}`);
      throw new BillerNotSelectedException('No billerId provided for Bill Pay Loan');
    }

    if (type === LoanTypeCodes.Personal) {
      const personalBiller = await this.domainServices.loanServices.createPersonalBiller(loanCreateInput);
      if (!personalBiller) {
        this.logger.error('LoanCreateCommand: Failed to create personal Biller', { payload });
        throw new UnableToCreatePersonalBillerException('Failed to create personal biller');
      }
      loanCreateInput.billerId = personalBiller.id;
    }
    // TODO billingAccountNumebr validation here?

    // Link user to lender/borrower
    if (isLendLoan) {
      loanCreateInput.lenderId = creatorId;
    } else {
      loanCreateInput.borrowerId = creatorId;
    }

    // etc

    return this.domainServices.loanServices.createLoan(loanCreateInput);
  }
}
