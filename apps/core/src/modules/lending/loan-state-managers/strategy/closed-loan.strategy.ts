import { LoanPaymentType, LoanPaymentTypeCodes } from '@library/entity/enum';
import { Loan } from '@library/shared/domain/entity/loan.entity';
import { Injectable, Logger } from '@nestjs/common';
import { IPaymentEvaluationStrategy } from '../../interfaces';

/**
 * Payment evaluation strategy for closed loan state
 * In the closed state, the loan lifecycle is complete, so no transitions are allowed
 */
@Injectable()
export class ClosedLoanStrategy implements IPaymentEvaluationStrategy {
  private readonly logger: Logger = new Logger(ClosedLoanStrategy.name);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldTransitionToCompleted(loan: Loan, context: string): boolean {
    this.logger.debug(`Loan ${loan.id} closed state: no payment transitions available`);
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldTransitionToPaused(loan: Loan, context: string): boolean {
    this.logger.debug(`Loan ${loan.id} closed state: no payment transitions available`);
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldTransitionToResumed(loan: Loan, context: string): boolean {
    this.logger.debug(`Loan ${loan.id} closed state: no payment transitions available`);
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldTransitionToFallback(loan: Loan, context: string): boolean {
    this.logger.debug(`Loan ${loan.id} closed state: no payment transitions available`);
    return false;
  }

  getPaymentType(): LoanPaymentType {
    return LoanPaymentTypeCodes.Repayment;
  }
}
