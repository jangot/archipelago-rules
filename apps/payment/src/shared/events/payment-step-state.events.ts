import { PaymentStepState } from '@library/entity/enum';
import { IZngEvent } from '@library/shared/common/event/interface/izng-event';
import { PaymentStepEventName, PaymentStepEventNameType } from './event-names';

export class PaymentStepEventBase implements IZngEvent {
  public readonly name: PaymentStepEventNameType;
  public readonly isExternal: boolean;
  public readonly stepId: string;
  public readonly originalStepState?: PaymentStepState;

  constructor(eventName: PaymentStepEventNameType, stepId: string, isExternal: boolean = false, originalStepState?: PaymentStepState) {
    this.name = eventName;
    this.stepId = stepId;
    this.isExternal = isExternal;
    this.originalStepState = originalStepState;
  }
}

export class PaymentStepPendingEvent extends PaymentStepEventBase {
  constructor(stepId: string, originalStepState?: PaymentStepState) {
    super(PaymentStepEventName.PaymentStepPending, stepId, false, originalStepState);
  }
}

export class PaymentStepCompletedEvent extends PaymentStepEventBase {
  constructor(stepId: string, originalStepState?: PaymentStepState) {
    super(PaymentStepEventName.PaymentStepCompleted, stepId, false, originalStepState);
  }
}

export class PaymentStepFailedEvent extends PaymentStepEventBase {
  constructor(stepId: string, originalStepState?: PaymentStepState) {
    super(PaymentStepEventName.PaymentStepFailed, stepId, false, originalStepState);
  }
}
