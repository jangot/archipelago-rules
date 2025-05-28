import { ILoan } from '@library/entity/interface';
import { IRepositoryBase } from '@library/shared/common/data/ibase.repository';
import { LoanAssignToContactInput } from '@library/shared/types/lending';

export interface ILoanRepository extends IRepositoryBase<ILoan> {
  getByLenderId(lenderId: string): Promise<ILoan[] | null>; // for example purposes

  setLoansTarget(input: LoanAssignToContactInput): Promise<ILoan[]>;
}

export const ILoanRepository = Symbol('ILoanRepository');
