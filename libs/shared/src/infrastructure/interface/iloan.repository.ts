import { ILoan } from '@library/entity/entity-interface';
import { IRepositoryBase } from '@library/shared/common/data/ibase.repository';
import { LoanRelation } from '@library/shared/domain/entity/relation';
// import { LoansSetTargetUserInput } from '@library/shared/type/lending';

export interface ILoanRepository extends IRepositoryBase<ILoan> {
  getLoanById(loanId: string, relations?: LoanRelation[]): Promise<ILoan | null>;
  getByLenderId(lenderId: string): Promise<ILoan[] | null>; // for example purposes
  createLoan(loan: Partial<ILoan>): Promise<ILoan | null>;
  // assignUserToLoans(input: LoansSetTargetUserInput): Promise<void>;
}

export const ILoanRepository = Symbol('ILoanRepository');
