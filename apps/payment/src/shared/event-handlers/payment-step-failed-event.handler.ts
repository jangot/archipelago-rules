import { LOAN_PAYMENT_STEP_RELATIONS } from '@library/shared/domain/entity/relation';
import { PaymentStepFailedEvent } from '@library/shared/events';
import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { IDomainServices } from '@payment/modules/domain';
import { LoanPaymentService } from '@payment/modules/loan-payments';

@Injectable()
@EventsHandler(PaymentStepFailedEvent)
export class PaymentStepFailedEventHandler implements IEventHandler<PaymentStepFailedEvent> {
  private readonly logger = new Logger(PaymentStepFailedEventHandler.name);

  constructor(private readonly domainServices: IDomainServices, private readonly paymentService: LoanPaymentService) {}

  async handle(event: PaymentStepFailedEvent): Promise<boolean | null> {
    const { stepId, originalStepState } = event.payload;
    this.logger.debug(`Handling PaymentStepFailedEvent for stepId: ${stepId}, originalStepState: ${originalStepState}`);

    // Load Payment Step by ID to then advance a Payment
    const paymentStep = await this.domainServices.paymentServices.getLoanPaymentStepById(stepId, [LOAN_PAYMENT_STEP_RELATIONS.Payment]);
    if (!paymentStep) {
      this.logger.error(`Payment Step with ID ${stepId} not found.`);
      return false;
    }

    const { loanPaymentId, loanPayment } = paymentStep;
    const { type } = loanPayment;
    this.logger.debug(`Advancing payment for loanPaymentId: ${loanPaymentId}`);

    return this.paymentService.advancePayment(loanPaymentId, type);
  }
}
