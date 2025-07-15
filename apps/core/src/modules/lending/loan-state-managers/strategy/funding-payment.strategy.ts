import { ILoan } from '@library/entity/entity-interface';
import { LoanPaymentType, LoanPaymentTypeCodes } from '@library/entity/enum';
import { Injectable } from '@nestjs/common';
import { IPaymentEvaluationStrategy } from '../../interfaces';
import { BaseLoanStateManager } from '../base-loan-state-manager';

@Injectable()
export class FundingPaymentStrategy implements IPaymentEvaluationStrategy {
  constructor(private stateManager: BaseLoanStateManager) {}

  shouldTransitionToCompleted(loan: ILoan, context: string): boolean {
    return this.stateManager.isPaymentCompleted(loan, LoanPaymentTypeCodes.Funding, context);
  }

  shouldTransitionToPaused(loan: ILoan, context: string): boolean {
    return this.stateManager.isPaymentFailed(loan, LoanPaymentTypeCodes.Funding, context);
  }

  shouldTransitionToResumed(loan: ILoan, context: string): boolean {
    return this.stateManager.isPaymentPending(loan, LoanPaymentTypeCodes.Funding, context);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldTransitionToFallback(loan: ILoan, context: string): boolean {
    // Future: implement funding-specific fallback logic
    return false;
  }

  getPaymentType(): LoanPaymentType {
    return LoanPaymentTypeCodes.Funding;
  }
}
