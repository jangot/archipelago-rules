import { PaymentAccountProvider } from '@library/entity/enum';
import { ZirtueEvent } from '@library/shared/modules/event';

/**
 * Base payload class for transfer-related events.
 * 
 * Contains the essential information needed to identify a transfer
 * and its associated payment provider during transfer processing.
 */
export class TransferEventPayload {
  public transferId: string;
  public providerType?: PaymentAccountProvider;

  constructor(transferId: string, providerType?: PaymentAccountProvider) {
    this.transferId = transferId;
    this.providerType = providerType;
  }
}

/**
 * Event representing the execution of a transfer.
 * 
 * This event is fired when a transfer has been initiated and
 * is being executed by the payment provider, indicating that
 * the transfer process has started.
 * 
 * @remarks
 * - Source: `payment` service (triggered when transfer execution begins)
 * - Target: `payment` service (TransferExecutedEventHandler) to handle transfer execution
 */
export class TransferExecutedEvent extends ZirtueEvent<TransferEventPayload> {
  /**
   * Creates a new TransferExecutedEvent instance.
   * 
   * @param transferId - The unique identifier of the transfer
   * @param providerType - The payment account provider handling the transfer (optional)
   * @returns A new TransferExecutedEvent instance
   */
  public static create(transferId: string, providerType?: PaymentAccountProvider): TransferExecutedEvent {
    return new TransferExecutedEvent(new TransferEventPayload(transferId, providerType));
  }
}

/**
 * Event representing the successful completion of a transfer.
 * 
 * This event is fired when a transfer has been successfully
 * completed by the payment provider, indicating that the funds
 * have been successfully moved between accounts.
 * 
 * @remarks
 * - Source: `payment` service (triggered on successful transfer completion)
 * - Target: `payment` service (TransferCompletedEventHandler) to handle transfer completion
 */
export class TransferCompletedEvent extends ZirtueEvent<TransferEventPayload> {
  /**
   * Creates a new TransferCompletedEvent instance.
   * 
   * @param transferId - The unique identifier of the transfer
   * @param providerType - The payment account provider that completed the transfer (optional)
   * @returns A new TransferCompletedEvent instance
   */
  public static create(transferId: string, providerType?: PaymentAccountProvider): TransferCompletedEvent {
    return new TransferCompletedEvent(new TransferEventPayload(transferId, providerType));
  }
}

/**
 * Event representing a failed transfer attempt.
 * 
 * This event is fired when a transfer fails during processing,
 * whether due to insufficient funds, network issues, provider
 * errors, or other transfer processing failures.
 * 
 * @remarks
 * - Source: `payment` service (triggered on transfer failure)
 * - Target: `payment` service (TransferFailedEventHandler) to handle transfer failure
 * 
 * @todo
 * TODO: Error should be already attached to Transfer Entity when this event is emitted
 * Might be external to tell the Loan that it is time to pause the state \ attach error
 */
export class TransferFailedEvent extends ZirtueEvent<TransferEventPayload> {
  /**
   * Creates a new TransferFailedEvent instance.
   * 
   * @param transferId - The unique identifier of the transfer
   * @param providerType - The payment account provider where the transfer failed (optional)
   * @returns A new TransferFailedEvent instance
   */
  public static create(transferId: string, providerType?: PaymentAccountProvider): TransferFailedEvent {
    return new TransferFailedEvent(new TransferEventPayload(transferId, providerType));
  }
}
