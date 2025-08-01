import { TRANSFER_RELATIONS } from '@library/shared/domain/entity/relation';
import { TransferFailedEvent } from '@library/shared/events';
import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { IDomainServices } from '@payment/modules/domain';
import { LoanPaymentStepService } from '@payment/modules/loan-payment-steps';

@Injectable()
@EventsHandler(TransferFailedEvent)
export class TransferFailedEventHandler implements IEventHandler<TransferFailedEvent> {
  private readonly logger: Logger = new Logger(TransferFailedEventHandler.name);

  constructor(private readonly domainServices: IDomainServices, private readonly paymentStepService: LoanPaymentStepService) {}

  async handle(event: TransferFailedEvent): Promise<boolean | null> {
    const { transferId, providerType } = event.payload;
    this.logger.debug(`Handling TransferFailedEvent for transferId: ${transferId}, providerType: ${providerType}`);

    // Load Transfer by ID to then advance a payment step
    const transfer = await this.domainServices.paymentServices.getTransferById(transferId, [TRANSFER_RELATIONS.Error]);
    if (!transfer) {
      this.logger.error(`Transfer with ID ${transferId} not found.`);
      return false;
    }
    const { loanPaymentStepId, error } = transfer;
    if (!loanPaymentStepId) {
      this.logger.warn(`Transfer with ID ${transferId} does not have an associated loan payment step.`);
      return true; // No step to update, but transfer is failed
    }

    // Failing Payment Step
    this.logger.debug(`Failing payment step for loanPaymentStepId: ${loanPaymentStepId} with error`, error);
    // TODO: Here we can decide is `error` a business or technical before calling step advance (to keep step `pending` if technical error)
    return this.paymentStepService.advanceStep(loanPaymentStepId);
  }
}
