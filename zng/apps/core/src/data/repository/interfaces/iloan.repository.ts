import { IRepositoryBase } from '@library/shared/common/data/ibase.repository';
import { Loan } from '../../entity';

export interface ILoanRepository extends IRepositoryBase<Loan> {
  getByLenderId(lenderId: string): Promise<Loan[] | null>; // for example purposes
}

export const ILoanRepository = Symbol('ILoanRepository');
