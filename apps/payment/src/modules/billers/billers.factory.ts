import { BillerNetworkType, BillerNetworkTypeCodes } from '@library/entity/enum/biller-network.type';
import { Injectable, Logger } from '@nestjs/common';
import { FileSourceFactory } from './file-sources/file-source.factory';
import { IBillerProvider } from './interfaces/billers-provider.interface';
import { FileOriginType } from './interfaces/file-origin-type.enum';
import { RppsBillerProvider } from './providers/rpps-biller-provider';

/**
 * BillerProviderFactory creates new instances of BillerProviders based on the network type and file origin.
 */
@Injectable()
export class BillerProviderFactory {
  private readonly logger: Logger = new Logger(BillerProviderFactory.name);

  constructor(private readonly fileSourceFactory: FileSourceFactory) {}

  /**
   * Creates a new BillerProvider for the specified network type and file origin.
   * @param billerNetworkType The type of biller network
   * @param fileOrigin The origin of the file
   * @returns The appropriate BillerProvider instance
   */
  public create(billerNetworkType: BillerNetworkType, fileOrigin: FileOriginType): IBillerProvider {
    const fileSource = this.fileSourceFactory.create(fileOrigin);
    switch (billerNetworkType) {
      case BillerNetworkTypeCodes.RPPS:
        return new RppsBillerProvider(fileSource);
      default:
        throw new Error(`Unsupported biller network type: ${billerNetworkType}`);
    }
  }
}
