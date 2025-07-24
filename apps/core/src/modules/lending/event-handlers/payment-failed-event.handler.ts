import { LoansService } from '@core/modules/lending/loans.service';
import { PaymentFailedEvent } from '@library/shared/events';
import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

@Injectable()
@EventsHandler(PaymentFailedEvent)
export class PaymentFailedEventHandler implements IEventHandler<PaymentFailedEvent> {
  private readonly logger: Logger = new Logger(PaymentFailedEventHandler.name);
  
  constructor(private readonly loansService: LoansService) { }
  
  async handle(event: PaymentFailedEvent): Promise<boolean | null> {
    const { loanId, paymentId, originalPaymentState } = event;
    this.logger.debug(`Handling PaymentFailedEvent in loan: ${loanId} for paymentId: ${paymentId}, originalPaymentState: ${originalPaymentState}`);

    return this.loansService.advanceLoan(loanId);
  }
}
