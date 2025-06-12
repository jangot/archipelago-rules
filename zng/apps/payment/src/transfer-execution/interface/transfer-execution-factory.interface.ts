import { PaymentAccountProvider } from '@library/entity/enum';
import { ITransferExecutionProvider } from './transfer-execution-provider.interface';

export interface ITransferExecutionFactory {
  getProvider(transferId: string, providerType?: PaymentAccountProvider): Promise<ITransferExecutionProvider>;
}
