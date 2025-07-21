import { LoanPaymentType } from '@library/entity/enum';
import { Loan } from '@library/shared/domain/entity';

export interface IPaymentEvaluationStrategy {
  shouldTransitionToCompleted(loan: Loan, context: string): boolean;
  shouldTransitionToPaused(loan: Loan, context: string): boolean;
  shouldTransitionToResumed(loan: Loan, context: string): boolean;
  shouldTransitionToFallback(loan: Loan, context: string): boolean;
  getPaymentType(): LoanPaymentType;
}
