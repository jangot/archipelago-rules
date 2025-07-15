import { ILoan } from '@library/entity/entity-interface';
import { LoanPaymentType, LoanPaymentTypeCodes } from '@library/entity/enum';
import { Injectable } from '@nestjs/common';
import { IPaymentEvaluationStrategy } from '../../interfaces';
import { BaseLoanStateManager } from '../base-loan-state-manager';

@Injectable()
export class RepaymentStrategy implements IPaymentEvaluationStrategy {
  constructor(private stateManager: BaseLoanStateManager) {}

  shouldTransitionToCompleted(loan: ILoan, context: string): boolean {
    const isCompleted = this.stateManager.isPaymentCompleted(loan, LoanPaymentTypeCodes.Repayment, context);
    // Special logic: repayment is only "completed" if it's the last payment
    return isCompleted && this.stateManager.isLastPayment(loan);
  }

  shouldTransitionToPaused(loan: ILoan, context: string): boolean {
    return this.stateManager.isPaymentFailed(loan, LoanPaymentTypeCodes.Repayment, context);
  }

  shouldTransitionToResumed(loan: ILoan, context: string): boolean {
    return this.stateManager.isPaymentPending(loan, LoanPaymentTypeCodes.Repayment, context);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldTransitionToFallback(loan: ILoan, context: string): boolean {
    // Future: implement forgiveness/closure logic
    return false;
  }

  getPaymentType(): LoanPaymentType {
    return LoanPaymentTypeCodes.Repayment;
  }
}
