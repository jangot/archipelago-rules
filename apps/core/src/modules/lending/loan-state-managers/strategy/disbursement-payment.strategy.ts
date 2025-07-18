import { LoanPaymentType, LoanPaymentTypeCodes } from '@library/entity/enum';
import { Loan } from '@library/shared/domain/entity';
import { Injectable, Logger } from '@nestjs/common';
import { IPaymentEvaluationStrategy } from '../../interfaces';
import { StatesManagersLogic } from '../states-managers-logic.service';

@Injectable()
export class DisbursementPaymentStrategy implements IPaymentEvaluationStrategy {
  private readonly logger: Logger = new Logger(DisbursementPaymentStrategy.name);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldTransitionToCompleted(loan: Loan, context: string): boolean {
    const result = StatesManagersLogic.isPaymentCompleted(loan, LoanPaymentTypeCodes.Disbursement);
    this.logger.debug(`Loan ${loan.id} disbursement payment evaluation: ${result ? 'completed' : 'not completed'}`);
    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldTransitionToPaused(loan: Loan, context: string): boolean {
    const result = StatesManagersLogic.isPaymentFailed(loan, LoanPaymentTypeCodes.Disbursement);
    this.logger.debug(`Loan ${loan.id} disbursement payment evaluation: ${result ? 'failed (paused)' : 'not failed'}`);
    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldTransitionToResumed(loan: Loan, context: string): boolean {
    const result = StatesManagersLogic.isPaymentPending(loan, LoanPaymentTypeCodes.Disbursement);
    this.logger.debug(`Loan ${loan.id} disbursement payment evaluation: ${result ? 'pending (resume)' : 'not pending'}`);
    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldTransitionToFallback(loan: Loan, context: string): boolean {
    // Future: implement disbursement-specific fallback logic
    return false;
  }

  getPaymentType(): LoanPaymentType {
    return LoanPaymentTypeCodes.Disbursement;
  }
}
