import { LoanPaymentState } from '@library/entity/enum';
import { IZngEvent } from '@library/shared/common/event/interface/izng-event';
import { PaymentEventName, PaymentEventNameType } from './event-names';

export class PaymentEventBase implements IZngEvent {
  public readonly name: PaymentEventNameType;
  public readonly isExternal: boolean;
  public readonly paymentId: string;
  public readonly originalPaymentState?: LoanPaymentState;

  constructor(eventName: PaymentEventNameType, paymentId: string, isExternal: boolean = false, originalPaymentState?: LoanPaymentState) {
    this.name = eventName;
    this.paymentId = paymentId;
    this.isExternal = isExternal;
    this.originalPaymentState = originalPaymentState;
  }
}

export class PaymentPendingEvent extends PaymentEventBase {
  constructor(paymentId: string, originalPaymentState?: LoanPaymentState) {
    super(PaymentEventName.PaymentPending, paymentId, true, originalPaymentState);
  }
}

export class PaymentSteppedEvent extends PaymentEventBase {
  constructor(paymentId: string, originalPaymentState?: LoanPaymentState) {
    super(PaymentEventName.PaymentStepped, paymentId, false, originalPaymentState);
  }
}

export class PaymentCompletedEvent extends PaymentEventBase {
  constructor(paymentId: string, originalPaymentState?: LoanPaymentState) {
    super(PaymentEventName.PaymentCompleted, paymentId, true, originalPaymentState);
  }
}

export class PaymentFailedEvent extends PaymentEventBase {
  constructor(paymentId: string, originalPaymentState?: LoanPaymentState) {
    super(PaymentEventName.PaymentFailed, paymentId, true, originalPaymentState);
  }
}
