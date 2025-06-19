import { Injectable } from '@nestjs/common';
import { BasePaymentStepManager } from './base-payment-step-manager';
import { PaymentDomainService } from '@payment/domain/services';
import { PaymentStepStateCodes } from '@library/entity/enum';
import { PaymentStepStateIsOutOfSyncException } from '@payment/domain/exceptions';

@Injectable()
export class CompletedStepManager extends BasePaymentStepManager {


  constructor(protected readonly paymentDomainService: PaymentDomainService) {
    super(paymentDomainService, PaymentStepStateCodes.Completed);
  }

  /**
   * Step: Completed, Transfer: Created
   * Possible cases:
   * - states out-of-sync -> report about this
   * @param stepId 
   * @param transferId 
   */
  protected async onTransferCreated(stepId: string, transferId: string): Promise<boolean | null> {
    throw new PaymentStepStateIsOutOfSyncException(`Step: ${stepId} is in Completed state, but Transfer: ${transferId} is Created.`);
  }

  /**
   * Step: Completed, Transfer: Completed
   * Possible cases:
   * - states out-of-sync -> report about this
   * @param stepId 
   * @param transferId 
   */
  protected async onTransferCompleted(stepId: string, transferId: string): Promise<boolean | null> {
    throw new PaymentStepStateIsOutOfSyncException(`Step: ${stepId} already is in Completed state, but trying to  advance after Transfer: ${transferId} is Completed.`);
  }

  /**
   * Step: Completed, Transfer: Failed
   * Possible cases:
   * - states out-of-sync -> report about this
   * @param stepId 
   * @param transferId 
   */
  protected async onTransferFailed(stepId: string, transferId: string): Promise<boolean | null> {
    throw new PaymentStepStateIsOutOfSyncException(`Step: ${stepId} is in Completed state, but Transfer: ${transferId} is Failed.`);
  }

  /**
   * Step: Completed, Transfer: Pending
   * Possible cases:
   * - states out-of-sync -> report about this
   * @param stepId 
   * @param transferId 
   */
  protected async onTransferPending(stepId: string, transferId: string): Promise<boolean | null> {
    throw new PaymentStepStateIsOutOfSyncException(`Step: ${stepId} is in Completed state, but Transfer: ${transferId} is Pending.`);
  }

  /**
   * Step: Completed, Transfer not found
   * Possible cases:
   * - states out-of-sync -> report about this
   * @param stepId 
   */
  protected async onTransferNotFound(stepId: string): Promise<boolean | null> {
    throw new PaymentStepStateIsOutOfSyncException(`Step: ${stepId} is in Completed state, but no Transfers found.`);
  }
}
