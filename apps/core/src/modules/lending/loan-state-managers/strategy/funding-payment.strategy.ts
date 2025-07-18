import { LoanPaymentType, LoanPaymentTypeCodes } from '@library/entity/enum';
import { Loan } from '@library/shared/domain/entity/loan.entity';
import { Injectable, Logger } from '@nestjs/common';
import { IPaymentEvaluationStrategy } from '../../interfaces';
import { StatesManagersLogic } from '../states-managers-logic.service';

@Injectable()
export class FundingPaymentStrategy implements IPaymentEvaluationStrategy {
  private readonly logger: Logger = new Logger(FundingPaymentStrategy.name);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldTransitionToCompleted(loan: Loan, context: string): boolean {
    const result = StatesManagersLogic.isPaymentCompleted(loan, LoanPaymentTypeCodes.Funding);
    this.logger.debug(`Loan ${loan.id} funding payment evaluation: ${result ? 'completed' : 'not completed'}`);
    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldTransitionToPaused(loan: Loan, context: string): boolean {
    const result = StatesManagersLogic.isPaymentFailed(loan, LoanPaymentTypeCodes.Funding);
    this.logger.debug(`Loan ${loan.id} funding payment evaluation: ${result ? 'failed (paused)' : 'not failed'}`);
    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldTransitionToResumed(loan: Loan, context: string): boolean {
    const result = StatesManagersLogic.isPaymentPending(loan, LoanPaymentTypeCodes.Funding);
    this.logger.debug(`Loan ${loan.id} funding payment evaluation: ${result ? 'pending (resume)' : 'not pending'}`);
    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldTransitionToFallback(loan: Loan, context: string): boolean {
    // Future: implement funding-specific fallback logic
    return false;
  }

  getPaymentType(): LoanPaymentType {
    return LoanPaymentTypeCodes.Funding;
  }
}
