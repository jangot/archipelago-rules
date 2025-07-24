import { LoanPaymentState } from '@library/entity/enum';
import { ZirtueDistributedEvent, ZirtueEvent } from '@library/shared/modules/event';

export class PaymentEventPayload {
  public loanId: string;
  public paymentId: string;
  public originalPaymentState?: LoanPaymentState;

  constructor(loanId: string, paymentId: string, originalPaymentState?: LoanPaymentState) {
    this.loanId = loanId;
    this.paymentId = paymentId;
    this.originalPaymentState = originalPaymentState;
  }
}

export class PaymentSteppedEvent extends ZirtueEvent<PaymentEventPayload> {
  public static create(loanId: string, paymentId: string, originalPaymentState?: LoanPaymentState): PaymentSteppedEvent {
    return new PaymentSteppedEvent(new PaymentEventPayload(loanId, paymentId, originalPaymentState));
  }
}

export class PaymentCompletedEvent extends ZirtueDistributedEvent<PaymentEventPayload> {
  public static create(loanId: string, paymentId: string, originalPaymentState?: LoanPaymentState): PaymentCompletedEvent {
    return new PaymentCompletedEvent(new PaymentEventPayload(loanId, paymentId, originalPaymentState));
  }
}

export class PaymentFailedEvent extends ZirtueDistributedEvent<PaymentEventPayload> {
  public static create(loanId: string, paymentId: string, originalPaymentState?: LoanPaymentState): PaymentFailedEvent {
    return new PaymentFailedEvent(new PaymentEventPayload(loanId, paymentId, originalPaymentState));
  }
}
