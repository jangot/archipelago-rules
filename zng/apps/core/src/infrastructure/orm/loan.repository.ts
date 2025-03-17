import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { ILoanRepository } from '../../shared/interfaces/repositories';
import { Loan } from '../../domain/entities';
import { ILoan } from '@library/entity/interface';

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
}
