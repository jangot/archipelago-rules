import { PaymentAccountProvider, PaymentAccountProviderCodes } from '@library/entity/enum';
import { Transfer } from '@library/shared/domain/entity';
import { TRANSFER_RELATIONS } from '@library/shared/domain/entity/relation';
import { Injectable } from '@nestjs/common';
import { PaymentDomainService } from '../domain/services';
import { ITransferExecutionFactory, ITransferExecutionProvider } from './interface';
import { CheckbookTransferExecutionProvider, FiservTransferExecutionProvider, MockTransferExecutionProvider, TabapayTransferExecutionProvider } from './providers';

@Injectable()
export class TransferExecutionFactory implements ITransferExecutionFactory {
  constructor(
    private readonly paymentDomainService: PaymentDomainService,
    private readonly mockedProvider: MockTransferExecutionProvider,
    private readonly checkbookProvider: CheckbookTransferExecutionProvider,
    private readonly fiservProvider: FiservTransferExecutionProvider,
    private readonly tabapayProvider: TabapayTransferExecutionProvider
  ) {} // Inject providers

  public async getProvider(transferId: string, providerType?: PaymentAccountProvider): Promise<ITransferExecutionProvider> {
    if (providerType) return this.getProviderByType(providerType);
    const transfer = await this.paymentDomainService.getTransferById(
      transferId, 
      [TRANSFER_RELATIONS.SourceAccount, TRANSFER_RELATIONS.DestinationAccount]
    );
    return this.getProviderByTransfer(transfer);
  }

  // TODO: Remove mock when Providers implemented
  private getProviderByType(providerType: PaymentAccountProvider): ITransferExecutionProvider {
    return this.mockedProvider; // Default to mocked provider for now

    switch (providerType) {
      case PaymentAccountProviderCodes.Checkbook:
        return this.checkbookProvider;
      case PaymentAccountProviderCodes.Fiserv:
        return this.fiservProvider;
      case PaymentAccountProviderCodes.Tabapay:
        return this.tabapayProvider;
      default:
        throw new Error(`Unsupported payment account provider: ${providerType}`);
    }
  }

  // TODO: Implement
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getProviderByTransfer(transfer: Transfer): ITransferExecutionProvider {
    return this.mockedProvider;
  }
}
