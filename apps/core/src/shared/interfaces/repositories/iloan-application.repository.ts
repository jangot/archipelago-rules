import { IRepositoryBase } from '@library/shared/common/data/ibase.repository';
import { LoanApplication } from '@library/shared/domain/entity';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ILoanApplicationRepository extends IRepositoryBase<LoanApplication> {
}

export const ILoanApplicationRepository = Symbol('ILoanApplicationRepository');
