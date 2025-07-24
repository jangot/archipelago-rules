import { LoanPaymentState } from '@library/entity/enum';
import { IZngOldEvent } from '@library/shared/common/event/interface/i-zng-old-event';
import { PaymentEventName, PaymentEventNameType } from './event-names';

export class PaymentEventBase implements IZngOldEvent {
  public name: PaymentEventNameType;
  public isExternal: boolean;
  public loanId: string;
  public paymentId: string;
  public originalPaymentState?: LoanPaymentState;

  constructor() { }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static create(...args: any[]): PaymentEventBase {
    return new PaymentEventBase();
  }
}

export class PaymentSteppedEvent extends PaymentEventBase {
  constructor() {
    super();
  }

  public static override create(loanId: string, paymentId: string, originalPaymentState?: LoanPaymentState): PaymentSteppedEvent {
    const event = new PaymentSteppedEvent();
    event.name = PaymentEventName.PaymentStepped;
    event.isExternal = false;
    event.loanId = loanId;
    event.paymentId = paymentId;
    event.originalPaymentState = originalPaymentState;
    return event;
  }
}

export class PaymentCompletedEvent extends PaymentEventBase {
  constructor() {
    super();
  }

  public static override create(loanId: string, paymentId: string, originalPaymentState?: LoanPaymentState): PaymentCompletedEvent {
    const event = new PaymentCompletedEvent();
    event.name = PaymentEventName.PaymentCompleted;
    event.isExternal = true;
    event.loanId = loanId;
    event.paymentId = paymentId;
    event.originalPaymentState = originalPaymentState;
    return event;
  }
}

export class PaymentFailedEvent extends PaymentEventBase {
  constructor() {
    super();
  }

  public static override create(loanId: string, paymentId: string, originalPaymentState?: LoanPaymentState): PaymentFailedEvent {
    const event = new PaymentFailedEvent();
    event.name = PaymentEventName.PaymentFailed;
    event.isExternal = true;
    event.loanId = loanId;
    event.paymentId = paymentId;
    event.originalPaymentState = originalPaymentState;
    return event;
  }
}
