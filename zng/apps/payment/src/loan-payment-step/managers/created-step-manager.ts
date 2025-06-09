import { Injectable } from '@nestjs/common';
import { BasePaymentStepManager } from './base-payment-step-manager';
import { PaymentStepStateCodes } from '@library/entity/enum';
import { IDomainServices } from '@payment/domain/idomain.services';

@Injectable()
export class CreatedStepManager extends BasePaymentStepManager {


  constructor(protected readonly domainServices: IDomainServices) {
    super(domainServices, PaymentStepStateCodes.Created);
  }

  public async advance(stepId: string): Promise<boolean | null> {
    throw new Error('Method not implemented.');
  }

  protected async onTransferCreated(stepId: string, transferId: string): Promise<boolean | null> {
    throw new Error('Method not implemented.');
  }

  protected async onTransferCompleted(stepId: string, transferId: string): Promise<boolean | null> {
    throw new Error('Method not implemented.');
  }

  protected async onTransferFailed(stepId: string, transferId: string): Promise<boolean | null> {
    throw new Error('Method not implemented.');
  }

  protected async onTransferPending(stepId: string, transferId: string): Promise<boolean | null> {
    throw new Error('Method not implemented.');
  }

  protected async onTransferNotFound(stepId: string): Promise<boolean | null> {
    throw new Error('Method not implemented.');
  }
}
