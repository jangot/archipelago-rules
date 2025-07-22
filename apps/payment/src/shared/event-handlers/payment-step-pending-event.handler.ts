import { LOAN_PAYMENT_STEP_RELATIONS } from '@library/shared/domain/entity/relation';
import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { IDomainServices } from '@payment/modules/domain';
import { ManagementDomainService } from '@payment/modules/domain/services';
import { PaymentStepPendingEvent } from '../events';

@Injectable()
@EventsHandler(PaymentStepPendingEvent)
export class PaymentStepPendingEventHandler implements IEventHandler<PaymentStepPendingEvent> {
  private readonly logger = new Logger(PaymentStepPendingEventHandler.name);

  constructor(private readonly domainServices: IDomainServices, private readonly managementServices: ManagementDomainService) {}

  async handle(event: PaymentStepPendingEvent): Promise<boolean | null> {
    const { stepId } = event;
    this.logger.debug(`Handling PaymentStepPendingEvent for stepId: ${stepId}`);

    // Load Payment Step by ID to then advance a Payment
    const paymentStep = await this.domainServices.paymentServices.getLoanPaymentStepById(stepId, [LOAN_PAYMENT_STEP_RELATIONS.Payment]);
    if (!paymentStep) {
      this.logger.error(`Payment Step with ID ${stepId} not found.`);
      return false;
    }

    const { loanPaymentId, loanPayment } = paymentStep;
    const { type } = loanPayment;
    this.logger.debug(`Advancing payment for loanPaymentId: ${loanPaymentId}`);
    
    return this.managementServices.advancePayment(loanPaymentId, type);
  }
}
