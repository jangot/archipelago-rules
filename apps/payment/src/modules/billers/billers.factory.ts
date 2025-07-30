import { BillerNetworkType, BillerNetworkTypeCodes } from '@library/entity/enum/biller-network.type';
import { Injectable, Logger } from '@nestjs/common';
import { FileStorageFactory } from '@payment/modules/billers/factories/file-storage.factory';
import { RppsFileProcessor } from '@payment/modules/billers/processors';
import { BillerDomainService } from '@payment/modules/domain/services/biller.domain.service';
import { IBillerProvider } from './interfaces/billers-provider.interface';
import { FileOriginType } from './interfaces/file-origin-type.enum';
import { RppsBillerSplitter } from './processors/rpps-biller-splitter';
import { RppsBillerProvider } from './providers/rpps-biller-provider';

/**
 * BillerProviderFactory creates new instances of BillerProviders based on the network type and file origin.
 */
@Injectable()
export class BillerProviderFactory {
  private readonly logger: Logger = new Logger(BillerProviderFactory.name);

  constructor(
    private readonly fileStorageFactory: FileStorageFactory,
    private readonly rppsFileProcessor: RppsFileProcessor,
    private readonly rppsBillerSplitter: RppsBillerSplitter,
    private readonly billerDatabaseService: BillerDomainService,
  ) {}

  /**
   * Creates a new BillerProvider for the specified network type and file origin.
   * @param billerNetworkType The type of biller network
   * @param fileOrigin The origin of the file
   * @returns The appropriate BillerProvider instance
   */
  public create(billerNetworkType: BillerNetworkType, fileOrigin: FileOriginType): IBillerProvider {
    switch (billerNetworkType) {
      case BillerNetworkTypeCodes.RPPS:
        return new RppsBillerProvider(
          this.fileStorageFactory.create(fileOrigin),
          this.rppsFileProcessor,
          this.rppsBillerSplitter,
          this.billerDatabaseService,
        );
      default:
        throw new Error(`Unsupported biller network type: ${billerNetworkType}`);
    }
  }
}