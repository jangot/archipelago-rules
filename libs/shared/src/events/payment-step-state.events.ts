import { PaymentStepState } from '@library/entity/enum';
import { IZngEvent } from '@library/shared/common/event/interface/izng-event';
import { PaymentStepEventName, PaymentStepEventNameType } from './event-names';

export class PaymentStepEventBase implements IZngEvent {
  public name: PaymentStepEventNameType;
  public isExternal: boolean;
  public stepId: string;
  public originalStepState?: PaymentStepState;

  constructor() { }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static create(...args: any[]): PaymentStepEventBase {
    return new PaymentStepEventBase();
  }
}

export class PaymentStepPendingEvent extends PaymentStepEventBase {
  constructor() {
    super();
  }

  public static override create(stepId: string, originalStepState?: PaymentStepState): PaymentStepPendingEvent {
    const event = new PaymentStepPendingEvent();
    event.name = PaymentStepEventName.PaymentStepPending;
    event.isExternal = false;
    event.stepId = stepId;
    event.originalStepState = originalStepState;
    return event;
  }
}

export class PaymentStepCompletedEvent extends PaymentStepEventBase {
  constructor() {
    super();
  }

  public static override create(stepId: string, originalStepState?: PaymentStepState): PaymentStepCompletedEvent {
    const event = new PaymentStepCompletedEvent();
    event.name = PaymentStepEventName.PaymentStepCompleted;
    event.isExternal = false;
    event.stepId = stepId;
    event.originalStepState = originalStepState;
    return event;
  }
}

export class PaymentStepFailedEvent extends PaymentStepEventBase {
  constructor() {
    super();
  }

  public static override create(stepId: string, originalStepState?: PaymentStepState): PaymentStepFailedEvent {
    const event = new PaymentStepFailedEvent();
    event.name = PaymentStepEventName.PaymentStepFailed;
    event.isExternal = false;
    event.stepId = stepId;
    event.originalStepState = originalStepState;
    return event;
  }
}
