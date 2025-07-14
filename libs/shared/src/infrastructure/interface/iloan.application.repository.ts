import { IRepositoryBase } from '@library/shared/common/data/ibase.repository';
import { LoanApplication } from '@library/shared/domain/entity';

export type ILoanApplicationRepository = IRepositoryBase<LoanApplication>;

export const ILoanApplicationRepository = Symbol('ILoanApplicationRepository');
