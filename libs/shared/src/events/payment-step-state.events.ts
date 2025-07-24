import { PaymentStepState } from '@library/entity/enum';
import { ZirtueEvent } from '@library/shared/modules/event';

export class PaymentStepEventPayload {
  public stepId: string;
  public originalStepState?: PaymentStepState;

  constructor(stepId: string, originalStepState?: PaymentStepState) {
    this.stepId = stepId;
    this.originalStepState = originalStepState;
  }
}

export class PaymentStepPendingEvent extends ZirtueEvent<PaymentStepEventPayload> {
  public static create(stepId: string, originalStepState?: PaymentStepState): PaymentStepPendingEvent {
    return new PaymentStepPendingEvent(new PaymentStepEventPayload(stepId, originalStepState));
  }
}

export class PaymentStepCompletedEvent extends ZirtueEvent<PaymentStepEventPayload> {
  public static create(stepId: string, originalStepState?: PaymentStepState): PaymentStepCompletedEvent {
    return new PaymentStepCompletedEvent(new PaymentStepEventPayload(stepId, originalStepState));
  }
}

export class PaymentStepFailedEvent extends ZirtueEvent<PaymentStepEventPayload> {
  public static create(stepId: string, originalStepState?: PaymentStepState): PaymentStepFailedEvent {
    return new PaymentStepFailedEvent(new PaymentStepEventPayload(stepId, originalStepState));
  }
}
