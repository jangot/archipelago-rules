import { IRepositoryBase } from './ibase.repository';
import { LoanEntity } from '../../entity';

export interface ILoanRepository<T extends LoanEntity> extends IRepositoryBase<T> {
  getByLenderId(lenderId: string): Promise<T[] | null>; // for example purposes
}
