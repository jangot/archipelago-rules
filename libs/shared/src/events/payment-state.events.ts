import { LoanPaymentState } from '@library/entity/enum';
import { ZirtueDistributedEvent, ZirtueEvent } from '@library/shared/modules/event';

/**
 * Base payload class for payment-related events.
 * 
 * Contains the essential information needed to identify a payment
 * and its associated loan, along with optional state information.
 */
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

/**
 * Event representing a progression step within a payment process.
 * 
 * This event is fired when a payment advances through its processing steps
 * without changing its overall state.
 * 
 * @remarks
 * - Source: `payment` service (triggered during payment processing)
 * - Target: `payment` service (PaymentSteppedEventHandler) to start next PaymentStep
 */
export class PaymentSteppedEvent extends ZirtueEvent<PaymentEventPayload> {
  /**
   * Creates a new PaymentSteppedEvent instance.
   * 
   * @param loanId - The unique identifier of the loan
   * @param paymentId - The unique identifier of the payment
   * @param originalPaymentState - The original state of the payment before stepping (optional)
   * @returns A new PaymentSteppedEvent instance
   */
  public static create(loanId: string, paymentId: string, originalPaymentState?: LoanPaymentState): PaymentSteppedEvent {
    return new PaymentSteppedEvent(new PaymentEventPayload(loanId, paymentId, originalPaymentState));
  }
}

/**
 * Event representing the successful completion of a payment.
 * 
 * This event is fired when a payment has been successfully processed
 * and completed, indicating that the funds have been transferred
 * and the payment transaction is finalized.
 * 
 * @remarks
 * - Source: `payment` service (triggered on successful payment completion)
 * - Target: `core` service (handled by PaymentCompletedEventHandler)
 */
export class PaymentCompletedEvent extends ZirtueDistributedEvent<PaymentEventPayload> {
  /**
   * Creates a new PaymentCompletedEvent instance.
   * 
   * @param loanId - The unique identifier of the loan
   * @param paymentId - The unique identifier of the payment
   * @param originalPaymentState - The original state of the payment before completion (optional)
   * @returns A new PaymentCompletedEvent instance
   */
  public static create(loanId: string, paymentId: string, originalPaymentState?: LoanPaymentState): PaymentCompletedEvent {
    return new PaymentCompletedEvent(new PaymentEventPayload(loanId, paymentId, originalPaymentState));
  }
}

/**
 * Event representing a failed payment attempt.
 * 
 * This event is fired when a payment fails during processing,
 * whether due to insufficient funds, network issues, validation
 * errors, or other payment processing failures.
 * 
 * @remarks
 * - Source: `payment` service (triggered on payment failure)
 * - Target: `core` service (handled by PaymentFailedEventHandler)
 */
export class PaymentFailedEvent extends ZirtueDistributedEvent<PaymentEventPayload> {
  /**
   * Creates a new PaymentFailedEvent instance.
   * 
   * @param loanId - The unique identifier of the loan
   * @param paymentId - The unique identifier of the payment
   * @param originalPaymentState - The original state of the payment before failure (optional)
   * @returns A new PaymentFailedEvent instance
   */
  public static create(loanId: string, paymentId: string, originalPaymentState?: LoanPaymentState): PaymentFailedEvent {
    return new PaymentFailedEvent(new PaymentEventPayload(loanId, paymentId, originalPaymentState));
  }
}
