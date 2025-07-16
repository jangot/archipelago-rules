import { ILoan } from '@library/entity/entity-interface';
import { LoanPaymentType } from '@library/entity/enum';

export interface IPaymentEvaluationStrategy {
  shouldTransitionToCompleted(loan: ILoan, context: string): boolean;
  shouldTransitionToPaused(loan: ILoan, context: string): boolean;
  shouldTransitionToResumed(loan: ILoan, context: string): boolean;
  shouldTransitionToFallback(loan: ILoan, context: string): boolean;
  getPaymentType(): LoanPaymentType;
}
