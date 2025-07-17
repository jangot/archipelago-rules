import { ILoanApplication } from '@library/entity/entity-interface';
import { IRepositoryBase } from '@library/shared/common/data/ibase.repository';

export interface ILoanApplicationRepository extends IRepositoryBase<ILoanApplication> {
  getAllByUserId(userId: string): Promise<ILoanApplication[]>;
  getPendingLoanApplicationsByUserId(userId: string): Promise<ILoanApplication[]>;
}

export const ILoanApplicationRepository = Symbol('ILoanApplicationRepository');
