import { LoanPaymentType, LoanPaymentTypeCodes } from '@library/entity/enum';
import { Loan } from '@library/shared/domain/entity';
import { Injectable, Logger } from '@nestjs/common';
import { IPaymentEvaluationStrategy } from '../../interfaces';

/**
 * Payment evaluation strategy for accepted loan state
 * In the accepted state, no payments are processed yet, so all methods return false
 */
@Injectable()
export class AcceptedLoanStrategy implements IPaymentEvaluationStrategy {
  private readonly logger: Logger = new Logger(AcceptedLoanStrategy.name);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldTransitionToCompleted(loan: Loan, context: string): boolean {
    this.logger.debug(`Loan ${loan.id} accepted state: no payment transitions available`);
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldTransitionToPaused(loan: Loan, context: string): boolean {
    this.logger.debug(`Loan ${loan.id} accepted state: no payment transitions available`);
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldTransitionToResumed(loan: Loan, context: string): boolean {
    this.logger.debug(`Loan ${loan.id} accepted state: no payment transitions available`);
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldTransitionToFallback(loan: Loan, context: string): boolean {
    this.logger.debug(`Loan ${loan.id} accepted state: no payment transitions available`);
    return false;
  }

  getPaymentType(): LoanPaymentType {
    return LoanPaymentTypeCodes.Funding;
  }
}
