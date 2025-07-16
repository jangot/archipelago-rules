import { ILoan } from '@library/entity/entity-interface';
import { LoanStateCodes } from '@library/entity/enum';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Loan } from '@library/shared/domain/entity';
import { LoanRelation } from '@library/shared/domain/entity/relation';
// import { LoansSetTargetUserInput } from '@library/shared/type/lending';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILoanRepository } from '../interface';

@Injectable()
export class LoanRepository extends RepositoryBase<Loan> implements ILoanRepository {
  private readonly logger: Logger = new Logger(LoanRepository.name);

  constructor(
    @InjectRepository(Loan)
    protected readonly repository: Repository<Loan>
  ) {
    super(repository, Loan);
  }

  public async getLoanById(loanId: string, relations?: LoanRelation[]): Promise<ILoan | null> {
    this.logger.debug(`getLoanById: ${loanId}`, relations);

    return this.repository.findOne({ where: { id: loanId }, relations: relations });
  }



  public async getByLenderId(lenderId: string): Promise<ILoan[] | null> {
    this.logger.debug(`getByLenderId: ${lenderId}`);

    return this.repository.findBy({ lenderId });
  }

  public async createLoan(loan: Partial<Loan>): Promise<Loan | null> {
    this.logger.debug('createLoan:', loan);

    return this.insert({ ...loan, state: LoanStateCodes.Created }, true);
  }

  // TODO: Need to check with AlexK if this will be still needed
  /*
  public async assignUserToLoans(input: LoansSetTargetUserInput): Promise<void> {
     const { userId, loansTargets } = input;
    this.logger.debug(`assignUserToLoans: for User ${userId}`, loansTargets);


    // Make two arrays - for borrowerId and lenderId
    // const borrowerUpdates = loansTargets.filter(t => t.userType === LoanInviteeTypeCodes.Borrower).map(t => t.loanId);
    // const lenderUpdates = loansTargets.filter(t => t.userType === LoanInviteeTypeCodes.Lender).map(t => t.loanId);

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
  }*/
}
