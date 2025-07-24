import { PaymentAccountProvider } from '@library/entity/enum';
import { IZngOldEvent } from '@library/shared/common/event/interface/i-zng-old-event';
import { TransferEventName, TransferEventNameType } from './event-names';

export class TransferEventBase implements IZngOldEvent {
  public name: TransferEventNameType;
  public isExternal: boolean;
  public transferId: string;
  public providerType?: PaymentAccountProvider;

  constructor() { }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static create(...args: any[]): TransferEventBase {
    return new TransferEventBase();
  }
}

export class TransferExecutedEvent extends TransferEventBase {
  constructor() {
    super();
  }

  public static override create(transferId: string, providerType?: PaymentAccountProvider): TransferExecutedEvent {
    const event = new TransferExecutedEvent();
    event.name = TransferEventName.TransferExecuted;
    event.isExternal = false;
    event.transferId = transferId;
    event.providerType = providerType;
    return event;
  }
}

export class TransferCompletedEvent extends TransferEventBase {
  constructor() {
    super();
  }

  public static override create(transferId: string, providerType?: PaymentAccountProvider): TransferCompletedEvent {
    const event = new TransferCompletedEvent();
    event.name = TransferEventName.TransferCompleted;
    event.isExternal = false;
    event.transferId = transferId;
    event.providerType = providerType;
    return event;
  }
}

// TODO:
// Error should be already attached to Transfer Entity when this event is emitted
// Might be external to tell the Loan that it is time to pause the state \ attach error
export class TransferFailedEvent extends TransferEventBase {
  constructor() {
    super();
  }

  public static override create(transferId: string, providerType?: PaymentAccountProvider): TransferFailedEvent {
    const event = new TransferFailedEvent();
    event.name = TransferEventName.TransferFailed;
    event.isExternal = false;
    event.transferId = transferId;
    event.providerType = providerType;
    return event;
  }
}
