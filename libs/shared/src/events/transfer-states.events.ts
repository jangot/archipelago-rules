import { PaymentAccountProvider } from '@library/entity/enum';
import { ZirtueEvent } from '@library/shared/modules/event';

export class TransferEventPayload {
  public transferId: string;
  public providerType?: PaymentAccountProvider;

  constructor(transferId: string, providerType?: PaymentAccountProvider) {
    this.transferId = transferId;
    this.providerType = providerType;
  }
}

export class TransferExecutedEvent extends ZirtueEvent<TransferEventPayload> {
  public static create(transferId: string, providerType?: PaymentAccountProvider): TransferExecutedEvent {
    return new TransferExecutedEvent(new TransferEventPayload(transferId, providerType));
  }
}

export class TransferCompletedEvent extends ZirtueEvent<TransferEventPayload> {
  public static create(transferId: string, providerType?: PaymentAccountProvider): TransferCompletedEvent {
    return new TransferCompletedEvent(new TransferEventPayload(transferId, providerType));
  }
}

// TODO:
// Error should be already attached to Transfer Entity when this event is emitted
// Might be external to tell the Loan that it is time to pause the state \ attach error
export class TransferFailedEvent extends ZirtueEvent<TransferEventPayload> {
  public static create(transferId: string, providerType?: PaymentAccountProvider): TransferFailedEvent {
    return new TransferFailedEvent(new TransferEventPayload(transferId, providerType));
  }
}
