import { ILoanPaymentStep } from '@library/entity/entity-interface';
import { PaymentStepState } from '@library/entity/enum';
import { IRepositoryBase } from '@library/shared/common/data';
import { LoanPaymentStepRelation } from '@library/shared/domain/entity/relation';
 
export interface ILoanPaymentStepRepository extends IRepositoryBase<ILoanPaymentStep> {
  getStepById(stepId: string, relations?: LoanPaymentStepRelation[]): Promise<ILoanPaymentStep | null>;
  createPaymentSteps(steps: Partial<ILoanPaymentStep>[]): Promise<ILoanPaymentStep[] | null>;
  updateStepState(stepId: string, state: PaymentStepState): Promise<boolean | null>;
}

export const ILoanPaymentStepRepository = Symbol('ILoanPaymentStepRepository');
