import { ILoanPaymentStep } from '@library/entity/interface';
import { IRepositoryBase } from '@library/shared/common/data';
import { DeepPartial } from 'typeorm';

 
export interface ILoanPaymentStepRepository extends IRepositoryBase<ILoanPaymentStep> {
  createPaymentSteps(steps: DeepPartial<ILoanPaymentStep>[]): Promise<ILoanPaymentStep[] | null>;
}

export const ILoanPaymentStepRepository = Symbol('ILoanPaymentStepRepository');
