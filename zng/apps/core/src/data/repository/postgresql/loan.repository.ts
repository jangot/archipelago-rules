import { ILoanRepository } from '../interfaces';
import { Injectable } from '@nestjs/common';
import { RepositoryBase } from '../common/base.repository';
import { ILoan } from '@library/entity/interface';
import { Loan } from '../../entity';

@Injectable()
export class LoanRepository extends RepositoryBase<Loan> implements ILoanRepository<ILoan> {
  // Implementation of ILoanRepository in TypeORM goes here
  public async getByLenderId(lenderId: string): Promise<ILoan[] | null> {
    return this.repository.findBy({ lenderId });
  }
}
