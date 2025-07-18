import { LoanPaymentType, LoanPaymentTypeCodes } from '@library/entity/enum';
import { Loan } from '@library/shared/domain/entity/loan.entity';
import { Injectable, Logger } from '@nestjs/common';
import { IPaymentEvaluationStrategy } from '../../interfaces';
import { StatesManagersLogic } from '../states-managers-logic.service';

@Injectable()
export class RepaymentStrategy implements IPaymentEvaluationStrategy {
  private readonly logger: Logger = new Logger(RepaymentStrategy.name);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldTransitionToCompleted(loan: Loan, context: string): boolean {
    const isCompleted = StatesManagersLogic.isPaymentCompleted(loan, LoanPaymentTypeCodes.Repayment);
    const isLast = StatesManagersLogic.isLastPayment(loan, LoanPaymentTypeCodes.Repayment);
    const result = isCompleted && isLast;
    this.logger.debug(`Loan ${loan.id} repayment evaluation: payment completed=${isCompleted}, is last=${isLast}, final result=${result ? 'completed' : 'not completed'}`);
    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldTransitionToPaused(loan: Loan, context: string): boolean {
    const result = StatesManagersLogic.isPaymentFailed(loan, LoanPaymentTypeCodes.Repayment);
    this.logger.debug(`Loan ${loan.id} repayment payment evaluation: ${result ? 'failed (paused)' : 'not failed'}`);
    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldTransitionToResumed(loan: Loan, context: string): boolean {
    const result = StatesManagersLogic.isPaymentPending(loan, LoanPaymentTypeCodes.Repayment);
    this.logger.debug(`Loan ${loan.id} repayment payment evaluation: ${result ? 'pending (resume)' : 'not pending'}`);
    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldTransitionToFallback(loan: Loan, context: string): boolean {
    // Future: implement forgiveness/closure logic
    return false;
  }

  getPaymentType(): LoanPaymentType {
    return LoanPaymentTypeCodes.Repayment;
  }
}
