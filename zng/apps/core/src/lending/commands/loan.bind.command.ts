import { ILoan } from '@library/entity/interface';
import { LendingBaseCommandHandler } from './lending.base.command-handler';
import { LoanBindCommand } from './lending.commands';
import { ICommandHandler } from '@nestjs/cqrs';
import { parseContactUri } from '@library/shared/common/helpers';
import { MissingInputException } from '@library/shared/common/exceptions/domain';
import { LoanBindIntentCodes, LoanStateCodes, RegistrationStatus } from '@library/entity/enum';

export class LoanBindCommandHandler 
  extends LendingBaseCommandHandler<LoanBindCommand, Array<ILoan> | null> 
  implements ICommandHandler<LoanBindCommand> {

  public async execute(command: LoanBindCommand): Promise<ILoan[] | null> {
    const { payload: { loanId, contactUri, intent } } = command;
    const loans: ILoan[] = [];

    // Before looking for Loans we should check that User with provided contact is registered  
    const parsedContact = parseContactUri(contactUri);
    if (!parsedContact) {
      throw new MissingInputException('Wrong target contact uri');
    }

    const { type: contactType, value: contactValue } = parsedContact;
    const user = await this.domainServices.userServices.getUserByContact(contactValue, contactType);

    if (!user || user.registrationStatus !== RegistrationStatus.Registered) {
      switch (intent) {
        // If intent is `propose` - it is okay if no such User yet (means that binding will happen when User registered)
        case LoanBindIntentCodes.Propose:
          this.logger.log(`Attempted to bind Loan ${loanId} to contact ${contactUri} during proposal but User not registered yet`, { command });
          break;
        case LoanBindIntentCodes.Registration:
          this.logger.error(`Attempted to bind Loan ${loanId} to contact ${contactUri} after registration but could not find User or registration not completed yet`, { command });
          break;
      }
      return null;
    }

    // If `loanId` provided - it means that Binding should be performed only on that loan
    // otherwise - we'll search for all loans targeting provided contactUri

    return this.domainServices.loanServices.bindLoansToUser(user.id, loanId || undefined, contactUri);
  }
}
