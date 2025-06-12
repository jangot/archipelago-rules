import { Injectable, Logger } from '@nestjs/common';
import { ILoanPaymentStepManager } from '../interfaces';
import { IDomainServices } from '@payment/domain/idomain.services';
import { ITransfer } from '@library/entity/interface';
import { PaymentStepState, TransferState, TransferStateCodes } from '@library/entity/enum';

@Injectable()
export abstract class BasePaymentStepManager implements ILoanPaymentStepManager {
  protected readonly logger: Logger;
  protected readonly stepState: PaymentStepState;
  
  constructor(protected readonly domainServices: IDomainServices, protected readonly state: PaymentStepState) {
    this.logger = new Logger(this.constructor.name);
    this.stepState = state;
  }

  public async advance(stepId: string): Promise<boolean | null> {
    this.logger.debug(`Advancing step with ID: ${stepId} in state: ${this.stepState}`);
    return this.advanceOnTransferState(stepId);
  }

  protected async getLatestTransfer(stepId: string): Promise<ITransfer | null> {
    return this.domainServices.paymentServices.getLatestTransferForStep(stepId);
  }

  protected async getLatestTransferState(stepId: string): Promise<TransferState | null> {
    const transfer = await this.getLatestTransfer(stepId);
    if (!transfer) return null;
    return transfer.state;
  }

  protected async advanceOnTransferState(stepId: string): Promise<boolean | null> {
    const transfer = await this.getLatestTransfer(stepId);
    if (!transfer) return this.onTransferNotFound(stepId);
    switch (transfer.state) {
      case TransferStateCodes.Created:
        return this.onTransferCreated(stepId, transfer.id);
      case TransferStateCodes.Completed:
        return this.onTransferCompleted(stepId, transfer.id);
      case TransferStateCodes.Failed:
        return this.onTransferFailed(stepId, transfer.id);
      case TransferStateCodes.Pending:
        return this.onTransferPending(stepId, transfer.id);
      default:
        this.logger.error(`Unhandled transfer state: ${transfer.state} for stepId: ${stepId}`);
        return null;
    }

  }

  protected abstract onTransferCreated(stepId: string, transferId: string): Promise<boolean | null>;
  protected abstract onTransferCompleted(stepId: string, transferId: string): Promise<boolean | null>;
  protected abstract onTransferFailed(stepId: string, transferId: string): Promise<boolean | null>;
  protected abstract onTransferPending(stepId: string, transferId: string): Promise<boolean | null>;
  protected abstract onTransferNotFound(stepId: string): Promise<boolean | null>;
}
