import { ILoanPaymentStep } from '@library/entity/interface';
import { IRepositoryBase } from '@library/shared/common/data';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ILoanPaymentStepRepository extends IRepositoryBase<ILoanPaymentStep> {}

export const ILoanPaymentStepRepository = Symbol('ILoanPaymentStepRepository');
