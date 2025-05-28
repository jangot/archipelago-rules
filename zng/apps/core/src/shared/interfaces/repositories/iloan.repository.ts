import { LoanRelation } from '@core/domain/entities/relations';
import { ILoan } from '@library/entity/interface';
import { IRepositoryBase } from '@library/shared/common/data/ibase.repository';
import { LoansSetTargetUserInput } from '@library/shared/types/lending';
import { DeepPartial } from 'typeorm';

export interface ILoanRepository extends IRepositoryBase<ILoan> {
  getLoanById(loanId: string, relations?: LoanRelation[]): Promise<ILoan | null>;
  getByLenderId(lenderId: string): Promise<ILoan[] | null>; // for example purposes
  createLoan(loan: DeepPartial<ILoan>): Promise<ILoan | null>;
  assignUserToLoans(input: LoansSetTargetUserInput): Promise<void>;
}

export const ILoanRepository = Symbol('ILoanRepository');
