import { Injectable, Logger } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { ILoan } from '@library/entity/interface';
import { LoansSetTargetUserInput } from '@library/shared/types/lending';
import { LoanInviteeTypeCodes, LoanStateCodes } from '@library/entity/enum';
import { Loan } from '@core/domain/entities';
import { ILoanRepository } from '@core/shared/interfaces/repositories';

@Injectable()
export class LoanRepository extends RepositoryBase<Loan> implements ILoanRepository {
  private readonly logger: Logger = new Logger(LoanRepository.name);

  constructor(
    @InjectRepository(Loan)
    protected readonly repository: Repository<Loan>
  ) {
    super(repository, Loan);
  }



  public async getByLenderId(lenderId: string): Promise<ILoan[] | null> {
    this.logger.debug(`getByLenderId: ${lenderId}`);

    return this.repository.findBy({ lenderId });
  }

  public async assignUserToLoans(input: LoansSetTargetUserInput): Promise<void> {
    const { userId, loansTargets } = input;
    this.logger.debug(`assignUserToLoans: for User ${userId}`, loansTargets);

    // Make two arrays - for borrowerId and lenderId
    const borrowerUpdates = loansTargets.filter(t => t.userType === LoanInviteeTypeCodes.Borrower).map(t => t.loanId);
    const lenderUpdates = loansTargets.filter(t => t.userType === LoanInviteeTypeCodes.Lender).map(t => t.loanId);

    // Run two bulk updates inside a transaction
    return this.repository.manager.transaction(async manager => {
      const repo = manager.getRepository(Loan);

      if (borrowerUpdates.length > 0) {
        await repo.update({ id: In(borrowerUpdates) }, { borrowerId: userId, state: LoanStateCodes.BorrowerAssigned });
      }

      if (lenderUpdates.length > 0) {
        await repo.update({ id: In(lenderUpdates) }, { lenderId: userId, state: LoanStateCodes.LenderAssigned });
      }
    });
  }
}
