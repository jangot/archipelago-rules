import { Injectable } from '@nestjs/common';
import { BasePaymentStepManager } from './base-payment-step-manager';
import { PaymentDomainService } from '@payment/domain/services';
import { PaymentStepStateCodes } from '@library/entity/enum';
import { PaymentStepStateIsOutOfSyncException } from '@payment/domain/exceptions';
import { LOAN_PAYMENT_STEP_RELATIONS } from '@library/shared/domain/entities/relations';

@Injectable()
export class PendingStepManager extends BasePaymentStepManager {


  constructor(protected readonly paymentDomainService: PaymentDomainService) {
    super(paymentDomainService, PaymentStepStateCodes.Pending);
  }

  /**
   * Step: Pending, Transfer: Created
   * Possible cases:
   * - previous Transfer was failed and new one created -> validate this condition and do nothing else
   * - step state is out-of-sync with Transfer state -> report about this 
   * @param stepId 
   * @param transferId 
   */
  protected async onTransferCreated(stepId: string, transferId: string): Promise<boolean | null> {
    this.logger.debug(`Step: ${stepId} is in Pending state, Transfer: ${transferId} is Created. Validating Step state.`);
    const step = await this.paymentDomainService.getLoanPaymentStepById(stepId, [LOAN_PAYMENT_STEP_RELATIONS.Transfers]);
    const { transfers } = step;
    if (!transfers || !transfers.length) {
      throw new PaymentStepStateIsOutOfSyncException(`Step: ${stepId} is in Pending state, but no Transfers found.`);
    }
    const actualTransfer = transfers.find(t => t.id === transferId);
    if (!actualTransfer) {
      throw new PaymentStepStateIsOutOfSyncException(`Step: ${stepId} is in Pending state, but Transfer: ${transferId} not found.`);
    }
    const { order: transferOrder } = actualTransfer;
    const previousWasFailed = transfers.find(t => t.order === transferOrder - 1)?.state === PaymentStepStateCodes.Failed;
    // If actual Transfer is the only Transfer for Step - it means Step is out-of-sync with Transfer state
    // If previous Transfer was not failed - it also means Step is out-of-sync with Transfer state
    if (transferOrder === 0 || !previousWasFailed) {
      throw new PaymentStepStateIsOutOfSyncException(`Step: ${stepId} is in Pending state, but Transfer: ${transferId} is Created.`);
    }
    return false;
  }

  /**
   * Step: Pending, Transfer: Completed
   * Possible cases:
   * - transer completed -> move step into completed state as well
   * @param stepId 
   * @param transferId 
   */
  protected async onTransferCompleted(stepId: string, transferId: string): Promise<boolean | null> {
    this.logger.debug(`Step: ${stepId} is in Pending state, Transfer: ${transferId} is Completed. Updating Step state to Completed.`);
    return this.paymentDomainService.updatePaymentStepState(stepId, PaymentStepStateCodes.Completed);
  }

  /**
   * Step: Pending, Transfer: Failed
   * Possible cases:
   * - transfer failed -> move step into failed state (if business error)
   * - transfer failed -> keep step in pendign state (if technical error)
   * @param stepId 
   * @param transferId 
   */
  protected async onTransferFailed(stepId: string, transferId: string): Promise<boolean | null> {
    // TODO: Implement Error type validation
    this.logger.debug(`Step: ${stepId} is in Pending state, Transfer: ${transferId} is Failed. Updating Step state to Failed.`);
    return this.paymentDomainService.updatePaymentStepState(stepId, PaymentStepStateCodes.Failed);
  }

  /**
   * Step: Pending, Transfer: Pending
   * Possible cases:
   * - transfer is still pending -> no action required (possible state polling)
   * @param stepId 
   * @param transferId 
   */
  protected async onTransferPending(stepId: string, transferId: string): Promise<boolean | null> {
    this.logger.debug(`Step: ${stepId} is in Pending state, Transfer: ${transferId} is Pending. No action required.`);
    return false;
  }

  /**
   * Step: Pending, Transfer: Not Found
   * Possible cases:
   * - transfer not found -> report about this
   * @param stepId 
   */
  protected async onTransferNotFound(stepId: string): Promise<boolean | null> {
    throw new PaymentStepStateIsOutOfSyncException(`Step: ${stepId} is in Pending state, but Transfer not found.`);
  }
}
