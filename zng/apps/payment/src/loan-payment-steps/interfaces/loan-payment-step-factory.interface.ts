import { PaymentStepState } from '@library/entity/enum';
import { ILoanPaymentStepManager } from './loan-payment-step-manager.interface';

export interface ILoanPaymentStepFactory {
  getManager(stepId: string, stepState?: PaymentStepState): Promise<ILoanPaymentStepManager>;
}

export const ILoanPaymentStepFactory = Symbol('ILoanPaymentStepFactory');
