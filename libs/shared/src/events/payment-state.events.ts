import { LoanPaymentState } from '@library/entity/enum';
import { IZngEvent } from '@library/shared/common/event/interface/izng-event';
import { PaymentEventName, PaymentEventNameType } from './event-names';

export class PaymentEventBase implements IZngEvent {
  public readonly name: PaymentEventNameType;
  public readonly isExternal: boolean;
  public readonly loanId: string;
  public readonly paymentId: string;
  public readonly originalPaymentState?: LoanPaymentState;

  constructor(
    eventName: PaymentEventNameType,
    loanId: string,
    paymentId: string,
    isExternal: boolean = false,
    originalPaymentState?: LoanPaymentState
  ) {
    this.name = eventName;
    this.loanId = loanId;
    this.paymentId = paymentId;
    this.isExternal = isExternal;
    this.originalPaymentState = originalPaymentState;
  }
}

export class PaymentSteppedEvent extends PaymentEventBase {
  constructor(loanId: string, paymentId: string, originalPaymentState?: LoanPaymentState) {
    super(PaymentEventName.PaymentStepped, loanId, paymentId, false, originalPaymentState);
  }
}

export class PaymentCompletedEvent extends PaymentEventBase {
  constructor(loanId: string, paymentId: string, originalPaymentState?: LoanPaymentState) {
    super(PaymentEventName.PaymentCompleted, loanId, paymentId, true, originalPaymentState);
  }
}

export class PaymentFailedEvent extends PaymentEventBase {
  constructor(loanId: string, paymentId: string, originalPaymentState?: LoanPaymentState) {
    super(PaymentEventName.PaymentFailed, loanId, paymentId, true, originalPaymentState);
  }
}
