import { PaymentAccountProvider } from '@library/entity/enum';
import { IZngEvent } from '@library/shared/common/event/interface/izng-event';

// TODO: move to Libs
export class TransferExecutedEvent implements IZngEvent {
  public readonly name: 'TransferExecuted'; // TODO: Move to a common enum for event names
  public readonly isExternal: boolean = false;
  public readonly transferId: string;
  public readonly providerType?: PaymentAccountProvider;

  constructor(transferId: string, providerType?: PaymentAccountProvider) {
    this.transferId = transferId;
    this.providerType = providerType;
  }
}
