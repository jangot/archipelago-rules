import { LOAN_PAYMENT_RELATIONS } from '@library/shared/domain/entity/relation';
import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { IDomainServices } from '@payment/modules/domain';
import { ManagementDomainService } from '@payment/modules/domain/services';
import { PaymentSteppedEvent } from '../events';

@Injectable()
@EventsHandler(PaymentSteppedEvent)
export class PaymentSteppedEventHandler implements IEventHandler<PaymentSteppedEvent> {
  private readonly logger: Logger = new Logger(PaymentSteppedEventHandler.name);
    
  constructor(private readonly domainServices: IDomainServices, private readonly managementServices: ManagementDomainService) { }
  
  async handle(event: PaymentSteppedEvent): Promise<boolean | null> {
    const { paymentId, originalPaymentState } = event;
    this.logger.debug(`Handling PaymentSteppedEvent for paymentId: ${paymentId}, originalPaymentState: ${originalPaymentState}`);

    // Load Payment by ID to then advance a new Payment Step if found
    const payment = await this.domainServices.paymentServices.getLoanPaymentById(paymentId, [LOAN_PAYMENT_RELATIONS.Steps]);
    if (!payment) {
      this.logger.error(`Payment with ID ${paymentId} not found.`);
      return false;
    }

    const { steps } = payment;
    const nextStep = this.domainServices.paymentServices.couldStartNextPaymentStep(steps);
    if (!nextStep) {
      this.logger.warn(`No next step available for paymentId: ${paymentId}.`);
      return null;
    }
    this.logger.debug(`Advancing payment for paymentId: ${paymentId} to next step with ID: ${nextStep}`);

    return this.managementServices.advancePaymentStep(nextStep);

  }
}
