import { ILoanRepository } from '../interfaces';
import { Inject, Injectable } from '@nestjs/common';
import { RepositoryBase } from '../common/base.repository';
import { ILoan } from '@library/entity/interface';
import { Loan } from '../../entity';
import { RepositoryKey } from '../common';
import { Repository } from 'typeorm';

@Injectable()
export class LoanRepository extends RepositoryBase<Loan> implements ILoanRepository<ILoan> {
  constructor(@Inject(RepositoryKey.LOAN) protected readonly repository: Repository<Loan>) {
    super(repository);
  }

  public async getByLenderId(lenderId: string): Promise<ILoan[] | null> {
    return this.repository.findBy({ lenderId });
  }
}
