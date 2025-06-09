import { Injectable } from '@nestjs/common';
import { ILoanPaymentStepFactory, ILoanPaymentStepManager } from './interfaces';
import { CompletedStepManager, CreatedStepManager, FailedStepManager, PendingStepManager } from './managers';
import { PaymentStepState, PaymentStepStateCodes } from '@library/entity/enum';
import { IDomainServices } from '@payment/domain/idomain.services';

@Injectable()
export class LoanPaymentStepFactory implements ILoanPaymentStepFactory {
  constructor(
    private readonly createdManager: CreatedStepManager,
    private readonly pendingManager: PendingStepManager,
    private readonly completedManager: CompletedStepManager,
    private readonly failedManager: FailedStepManager,
    private readonly domainServices: IDomainServices
  ) {}

  public async getManager(stepId: string, stepState?: PaymentStepState): Promise<ILoanPaymentStepManager> {
    if (stepState) return this.getManagerByState(stepState);
    const step = await this.domainServices.paymentServices.getLoanPaymentStepById(stepId);
    return this.getManagerByState(step.state);
  }

  private getManagerByState(stepState: PaymentStepState): ILoanPaymentStepManager {
    switch (stepState) {
      case PaymentStepStateCodes.Created:
        return this.createdManager;
      case PaymentStepStateCodes.Pending:
        return this.pendingManager;
      case PaymentStepStateCodes.Completed:
        return this.completedManager;
      case PaymentStepStateCodes.Failed:
        return this.failedManager;
      default:
        throw new Error(`Unsupported payment step state: ${stepState}`);
    }
  }
}
