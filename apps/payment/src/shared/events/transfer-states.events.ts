import { PaymentAccountProvider } from '@library/entity/enum';
import { IZngEvent } from '@library/shared/common/event/interface/izng-event';
import { TransferEventName, TransferEventNameType } from './transfer-event-name';

export class TransferEventBase implements IZngEvent {
  public readonly name: TransferEventNameType;
  public readonly isExternal: boolean;
  public readonly transferId: string;
  public readonly providerType?: PaymentAccountProvider;

  constructor(eventName: TransferEventNameType, transferId: string, isExternal: boolean = false, providerType?: PaymentAccountProvider) {
    this.transferId = transferId;
    this.name = eventName;
    this.isExternal = isExternal;
    this.providerType = providerType;
  }
}

export class TransferExecutedEvent extends TransferEventBase {
  constructor(transferId: string, providerType?: PaymentAccountProvider) {
    super(TransferEventName.TransferExecuted, transferId, false, providerType);
  }
}

export class TransferCompletedEvent extends TransferEventBase {
  constructor(transferId: string, providerType?: PaymentAccountProvider) {
    super(TransferEventName.TransferCompleted, transferId, false, providerType);
  }
}

// TODO:
// Error should be already attached to Transfer Entity when this event is emitted
// Might be external to tell the Loan that it is time to pause the state \ attach error
export class TransferFailedEvent extends TransferEventBase {
  constructor(transferId: string, providerType?: PaymentAccountProvider) {
    super(TransferEventName.TransferFailed, transferId, false, providerType);
  }
}
