import { ILoanRepository } from '../interfaces';
import { Injectable, Logger } from '@nestjs/common';
import { ILoan } from '@library/entity/interface';
import { Loan } from '../../entity';
import { Repository } from 'typeorm';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { InjectRepository } from '@nestjs/typeorm';

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
