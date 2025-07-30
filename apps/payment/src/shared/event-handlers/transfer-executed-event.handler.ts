import { TransferExecutedEvent } from '@library/shared/events';
import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { IDomainServices } from '@payment/modules/domain';
import { ManagementDomainService } from '@payment/modules/domain/services';

@Injectable()
@EventsHandler(TransferExecutedEvent)
export class TransferExecutedEventHandler implements IEventHandler<TransferExecutedEvent> {
  private readonly logger: Logger = new Logger(TransferExecutedEventHandler.name);

  constructor(private readonly domainServices: IDomainServices, private readonly managementServices: ManagementDomainService) {}

  async handle(event: TransferExecutedEvent): Promise<boolean | null> {
    const { transferId, providerType } = event.payload;
    this.logger.debug(`Handling TransferExecutedEvent for transferId: ${transferId}, providerType: ${providerType}`);

    // Load Transfer by ID to then advance a payment step
    const transfer = await this.domainServices.paymentServices.getTransferById(transferId);
    if (!transfer) {
      this.logger.error(`Transfer with ID ${transferId} not found.`);
      return false;
    }

    const { loanPaymentStepId } = transfer;
    if (!loanPaymentStepId) {
      this.logger.warn(`Transfer with ID ${transferId} does not have an associated loan payment step.`);
      return true; // No step to update, but transfer is executed
    }

    // Advancing Payment Step
    this.logger.debug(`Advancing payment step for loanPaymentStepId: ${loanPaymentStepId}`);
    return this.managementServices.advancePaymentStep(loanPaymentStepId);
  }
}
