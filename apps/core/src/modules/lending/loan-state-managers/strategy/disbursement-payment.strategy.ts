import { ILoan } from '@library/entity/entity-interface';
import { LoanPaymentType, LoanPaymentTypeCodes } from '@library/entity/enum';
import { Injectable } from '@nestjs/common';
import { IPaymentEvaluationStrategy } from '../../interfaces';
import { BaseLoanStateManager } from '../base-loan-state-manager';

@Injectable()
export class DisbursementPaymentStrategy implements IPaymentEvaluationStrategy {
  constructor(private stateManager: BaseLoanStateManager) {}

  shouldTransitionToCompleted(loan: ILoan, context: string): boolean {
    return this.stateManager.isPaymentCompleted(loan, LoanPaymentTypeCodes.Disbursement, context);
  }

  shouldTransitionToPaused(loan: ILoan, context: string): boolean {
    return this.stateManager.isPaymentFailed(loan, LoanPaymentTypeCodes.Disbursement, context);
  }

  shouldTransitionToResumed(loan: ILoan, context: string): boolean {
    return this.stateManager.isPaymentPending(loan, LoanPaymentTypeCodes.Disbursement, context);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldTransitionToFallback(loan: ILoan, context: string): boolean {
    // Future: implement disbursement-specific fallback logic
    return false;
  }

  getPaymentType(): LoanPaymentType {
    return LoanPaymentTypeCodes.Disbursement;
  }
}
