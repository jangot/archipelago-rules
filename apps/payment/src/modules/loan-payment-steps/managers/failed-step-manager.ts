import { PaymentStepStateCodes } from '@library/entity/enum';
import { Injectable } from '@nestjs/common';
import { PaymentStepStateIsOutOfSyncException } from '@payment/modules/domain/exceptions';
import { PaymentDomainService } from '@payment/modules/domain/services';
import { BasePaymentStepManager } from './base-payment-step-manager';

@Injectable()
export class FailedStepManager extends BasePaymentStepManager {


  constructor(protected readonly paymentDomainService: PaymentDomainService) {
    super(paymentDomainService, PaymentStepStateCodes.Failed);
  }

  /**
   * Step: Failed, Transfer: Created
   * Possible cases:
   * - states out-of-sync -> report about this
   * The case when Failed Step is retried by new Transfer should work as Step unlocks (came back to Pending) first
   * @param stepId 
   * @param transferId 
   */
  protected async onTransferCreated(stepId: string, transferId: string): Promise<boolean | null> {
    throw new PaymentStepStateIsOutOfSyncException(`Step: ${stepId} is in Failed state, but Transfer: ${transferId} is Created.`);
  }

  /**
   * Step: Failed, Transfer: Completed
   * Possible cases:
   * - states out-of-sync -> report about this
   * @param stepId 
   * @param transferId 
   */
  protected async onTransferCompleted(stepId: string, transferId: string): Promise<boolean | null> {
    throw new PaymentStepStateIsOutOfSyncException(`Step: ${stepId} is in Failed state, but Transfer: ${transferId} is Completed.`);
  }

  /**
   * Step: Failed, Transfer: Failed
   * Possible cases:
   * - states out-of-sync -> report about this
   * @param stepId 
   * @param transferId 
   */
  protected async onTransferFailed(stepId: string, transferId: string): Promise<boolean | null> {
    throw new PaymentStepStateIsOutOfSyncException(`Step: ${stepId} already is in Failed state, but Transfer: ${transferId} is Failed after.`);
  }

  /**
   * Step: Failed, Transfer: Pending
   * Possible cases:
   * - states out-of-sync -> report about this
   * @param stepId 
   * @param transferId 
   */
  protected async onTransferPending(stepId: string, transferId: string): Promise<boolean | null> {
    throw new PaymentStepStateIsOutOfSyncException(`Step: ${stepId} is in Failed state, but Transfer: ${transferId} is Pending.`);
  }

  /**
   * Step: Failed, Transfer not found
   * Possible cases:
   * - states out-of-sync -> report about this
   * @param stepId 
   */
  protected async onTransferNotFound(stepId: string): Promise<boolean | null> {
    throw new PaymentStepStateIsOutOfSyncException(`Step: ${stepId} is in Failed state, but Transfer not found.`);
  }
}
