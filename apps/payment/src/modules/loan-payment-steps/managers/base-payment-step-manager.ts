import { PaymentStepState, TransferState, TransferStateCodes } from '@library/entity/enum';
import { Transfer } from '@library/shared/domain/entity';
import { Injectable, Logger } from '@nestjs/common';
import { PaymentDomainService } from '@payment/modules/domain/services';
import { ILoanPaymentStepManager } from '../interfaces';

@Injectable()
export abstract class BasePaymentStepManager implements ILoanPaymentStepManager {
  protected readonly logger: Logger;
  protected readonly stepState: PaymentStepState;
  
  constructor(protected readonly paymentDomainService: PaymentDomainService, protected readonly state: PaymentStepState) {
    this.logger = new Logger(this.constructor.name);
    this.stepState = state;
  }

  public async advance(stepId: string): Promise<boolean | null> {
    this.logger.debug(`Advancing step with ID: ${stepId} in state: ${this.stepState}`);
    return this.advanceOnTransferState(stepId);
  }

  protected async getLatestTransfer(stepId: string): Promise<Transfer | null> {
    return this.paymentDomainService.getLatestTransferForStep(stepId);
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

  /**
   * Centralized method to change payment step state.
   * All specific managers should use this method to ensure consistent state changes and event emission.
   * @param stepId The ID of the payment step to update
   * @param newState The new state to transition to
   * @returns Promise<boolean | null> indicating success of the state change
   */
  protected async changeStepState(stepId: string, newState: PaymentStepState): Promise<boolean | null> {
    const previousState = this.stepState;

    if (previousState === newState) {
      this.logger.debug(`Step ${stepId} is already in state ${newState}, no change needed.`);
      return false;
    }
    
    this.logger.debug(`Changing step ${stepId} state from ${previousState} to ${newState}`, {
      stepId,
      previousState,
      newState,
    });

    return this.paymentDomainService.updatePaymentStepState(stepId, previousState, newState);
  }


  protected abstract onTransferCreated(stepId: string, transferId: string): Promise<boolean | null>;
  protected abstract onTransferCompleted(stepId: string, transferId: string): Promise<boolean | null>;
  protected abstract onTransferFailed(stepId: string, transferId: string): Promise<boolean | null>;
  protected abstract onTransferPending(stepId: string, transferId: string): Promise<boolean | null>;
  protected abstract onTransferNotFound(stepId: string): Promise<boolean | null>;
}
