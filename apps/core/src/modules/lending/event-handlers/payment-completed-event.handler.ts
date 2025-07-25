import { LoansService } from '@core/modules/lending/loans.service';
import { PaymentCompletedEvent } from '@library/shared/events';
import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

@Injectable()
@EventsHandler(PaymentCompletedEvent)
export class PaymentCompletedEventHandler implements IEventHandler<PaymentCompletedEvent> {
  private readonly logger: Logger = new Logger(PaymentCompletedEventHandler.name);

  constructor(private readonly loansService: LoansService) { }

  async handle(event: PaymentCompletedEvent): Promise<boolean | null> {
    const { loanId, paymentId, originalPaymentState } = event.payload;
    this.logger.debug(`Handling PaymentCompletedEvent in loan: ${loanId} for paymentId: ${paymentId}, originalPaymentState: ${originalPaymentState}`);

    return this.loansService.advanceLoan(loanId);
  }
}
