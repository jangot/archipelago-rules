import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Loan } from '@library/shared/domain/entity';
import { LoanRelation } from '@library/shared/domain/entity/relation';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class LoanRepository extends RepositoryBase<Loan> {
  private readonly logger: Logger = new Logger(LoanRepository.name);

  constructor(
    @InjectRepository(Loan)
    protected readonly repository: Repository<Loan>
  ) {
    super(repository, Loan);
  }

  public async getLoanById(loanId: string, relations?: LoanRelation[]): Promise<Loan | null> {
    this.logger.debug(`getLoanById: ${loanId}`);

    return this.repository.findOne({ where: { id: loanId }, relations });
  }

  public async getByLenderId(lenderId: string): Promise<Loan[] | null> {
    this.logger.debug(`getByLenderId: ${lenderId}`);

    return this.repository.findBy({ lenderId });
  }

  public async createLoan(loan: Partial<Loan>): Promise<Loan | null> {
    this.logger.debug('createLoan:', loan);

    return this.insert(loan, true);
  }
}
