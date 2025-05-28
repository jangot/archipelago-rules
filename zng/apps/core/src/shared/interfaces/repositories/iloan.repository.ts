import { ILoan } from '@library/entity/interface';
import { IRepositoryBase } from '@library/shared/common/data/ibase.repository';
import { LoansSetTargetUserInput } from '@library/shared/types/lending';

export interface ILoanRepository extends IRepositoryBase<ILoan> {
  getByLenderId(lenderId: string): Promise<ILoan[] | null>; // for example purposes
  assignUserToLoans(input: LoansSetTargetUserInput): Promise<void>;
}

export const ILoanRepository = Symbol('ILoanRepository');
