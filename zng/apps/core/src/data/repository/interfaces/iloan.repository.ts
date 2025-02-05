import { IRepositoryBase } from './ibase.repository';
import { Loan } from '../../entity';

export interface ILoanRepository<T extends Loan> extends IRepositoryBase<T> {
  getByLenderId(lenderId: string): Promise<T[] | null>; // for example purposes
}
