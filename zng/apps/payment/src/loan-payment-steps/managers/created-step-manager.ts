import { Injectable } from '@nestjs/common';
import { BasePaymentStepManager } from './base-payment-step-manager';
import { PaymentStepStateCodes } from '@library/entity/enum';
import { IDomainServices } from '@payment/domain/idomain.services';
import { PaymentStepStateIsOutOfSyncException } from '@payment/domain/exceptions';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class CreatedStepManager extends BasePaymentStepManager {


  constructor(protected readonly domainServices: IDomainServices) {
    super(domainServices, PaymentStepStateCodes.Created);
  }

  /**
   * Step: Created, Transfer: Created
   * Possible cases:
   * - transfer created but not executed yet -> update Step state to Pending
   * @param stepId 
   * @param transferId 
   */
  protected async onTransferCreated(stepId: string, transferId: string): Promise<boolean | null> {
    this.logger.debug(`Step: ${stepId} is in Created state, Transfer: ${transferId} is Created. Updating Step state to Pending.`);
    return this.domainServices.paymentServices.updatePaymentStepState(stepId, PaymentStepStateCodes.Pending);
  }

  /**
   * Step: Created, Transfer: Completed
   * Possible cases:
   * - states out-of-sync -> report about this
   * @param stepId 
   * @param transferId 
   */
  protected async onTransferCompleted(stepId: string, transferId: string): Promise<boolean | null> {
    throw new PaymentStepStateIsOutOfSyncException(`Step: ${stepId} is in Created state, but Transfer: ${transferId} is Completed.`);
  }

  /**
   * Step: Created, Transfer: Failed
   * Possible cases:
   * - states out-of-sync -> report about this
   * - TODO: Doublecheck Step state re-entrance on Transfer retry (expects to have Step Pending?)
   * @param stepId 
   * @param transferId 
   */
  protected async onTransferFailed(stepId: string, transferId: string): Promise<boolean | null> {
    throw new PaymentStepStateIsOutOfSyncException(`Step: ${stepId} is in Created state, but Transfer: ${transferId} is Failed.`);
  }

  
  /**
   * Step: Created, Transfer: Pending
   * Possible cases:
   * - state polling -> no action required (transfer will taken by CRON)
   * @param stepId 
   * @param transferId 
   */
  protected async onTransferPending(stepId: string, transferId: string): Promise<boolean | null> {
    this.logger.debug(`Step: ${stepId} is in Created state, Transfer: ${transferId} is Pending. No action required.`);
    return false;
  }

  /**
   * Step: Created, Transfer: Not Found
   * Possible cases:
   * - transfer not created yet -> create a new Transfer
   * @param stepId 
   */
  @Transactional()
  protected async onTransferNotFound(stepId: string): Promise<boolean | null> {
    this.logger.debug(`Step: ${stepId} is in Created state, Transfer not found. Creating a new Transfer.`);
    const transfer = await this.domainServices.paymentServices.createTransferForStep(stepId);
    const stepUpdate = await this.domainServices.paymentServices.updatePaymentStepState(stepId, PaymentStepStateCodes.Pending);
    if (!transfer) {
      this.logger.error(`Failed to create a transfer for step ${stepId}`);
      return false;
    }
    this.logger.debug(`Transfer created for step ${stepId} with ID ${transfer.id}`, { transfer });
    return stepUpdate;
  }
}
