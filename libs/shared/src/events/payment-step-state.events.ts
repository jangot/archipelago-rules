import { PaymentStepState } from '@library/entity/enum';
import { ZirtueEvent } from '@library/shared/modules/event';

/**
 * Base payload class for payment step-related events.
 * 
 * Contains the essential information needed to identify a specific
 * payment step and its state information during payment processing.
 */
export class PaymentStepEventPayload {
  public stepId: string;
  public originalStepState?: PaymentStepState;

  constructor(stepId: string, originalStepState?: PaymentStepState) {
    this.stepId = stepId;
    this.originalStepState = originalStepState;
  }
}

/**
 * Event representing a payment step entering a pending state.
 * 
 * This event is fired when a payment step begins processing and
 * transitions to a pending state, indicating that the step is
 * waiting for external validation, approval, or processing.
 * 
 * @remarks
 * - Source: `payment` service (triggered when step becomes pending)
 * - Target: `payment` service (PaymentStepPendingEventHandler)
 */
export class PaymentStepPendingEvent extends ZirtueEvent<PaymentStepEventPayload> {
  /**
   * Creates a new PaymentStepPendingEvent instance.
   * 
   * @param stepId - The unique identifier of the payment step
   * @param originalStepState - The original state of the step before becoming pending (optional)
   * @returns A new PaymentStepPendingEvent instance
   */
  public static create(stepId: string, originalStepState?: PaymentStepState): PaymentStepPendingEvent {
    return new PaymentStepPendingEvent(new PaymentStepEventPayload(stepId, originalStepState));
  }
}

/**
 * Event representing the successful completion of a payment step.
 * 
 * This event is fired when a payment step has been successfully
 * processed and completed, allowing the payment flow to proceed
 * to the next step or complete the overall payment process.
 * 
 * @remarks
 * - Source: `payment` service (triggered on step completion)
 * - Target: `payment` servcie (PaymentStepCompletedEventHandler)
 */
export class PaymentStepCompletedEvent extends ZirtueEvent<PaymentStepEventPayload> {
  /**
   * Creates a new PaymentStepCompletedEvent instance.
   * 
   * @param stepId - The unique identifier of the payment step
   * @param originalStepState - The original state of the step before completion (optional)
   * @returns A new PaymentStepCompletedEvent instance
   */
  public static create(stepId: string, originalStepState?: PaymentStepState): PaymentStepCompletedEvent {
    return new PaymentStepCompletedEvent(new PaymentStepEventPayload(stepId, originalStepState));
  }
}

/**
 * Event representing a failed payment step.
 * 
 * This event is fired when a payment step encounters an error
 * or failure during processing, such as validation failures,
 * authorization rejections, or technical processing errors.
 * 
 * @remarks
 * - Source: `payment` service (triggered on step failure)
 * - Target: `payment` service (PaymentStepFailedEventHandler)
 */
export class PaymentStepFailedEvent extends ZirtueEvent<PaymentStepEventPayload> {
  /**
   * Creates a new PaymentStepFailedEvent instance.
   * 
   * @param stepId - The unique identifier of the payment step
   * @param originalStepState - The original state of the step before failure (optional)
   * @returns A new PaymentStepFailedEvent instance
   */
  public static create(stepId: string, originalStepState?: PaymentStepState): PaymentStepFailedEvent {
    return new PaymentStepFailedEvent(new PaymentStepEventPayload(stepId, originalStepState));
  }
}
