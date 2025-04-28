import { ILoan } from '@library/entity/interface';
import { IRepositoryBase } from '@library/shared/common/data/ibase.repository';

export interface ILoanRepository extends IRepositoryBase<ILoan> {
  getByLenderId(lenderId: string): Promise<ILoan[] | null>; // for example purposes
  getLoansForBinding(contactUri: string): Promise<ILoan[]>;
  bindLoansToUser(userId: string, loanId?: string, contactUri?: string): Promise<ILoan[]>;
}

export const ILoanRepository = Symbol('ILoanRepository');
