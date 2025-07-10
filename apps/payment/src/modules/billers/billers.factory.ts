import { BillerNetworkType, BillerNetworkTypeCodes } from '@library/entity/enum/biller-network.type';
import { Injectable, Logger } from '@nestjs/common';
import { IBillerProvider } from './interfaces/billers-provider.interface';
import { RppsBillerProvider } from './providers/rpps-biller-provider';

/**
 * BillerProviderFactory creates new instances of BillerProviders based on the network type.
 */
@Injectable()
export class BillerProviderFactory {
  private readonly logger: Logger = new Logger(BillerProviderFactory.name);

  /**
   * Creates a new BillerProvider for the specified network type.
   * @param billerNetworkType The type of biller network
   * @returns The appropriate BillerProvider instance
   */
  public create(billerNetworkType: BillerNetworkType): IBillerProvider {
    switch (billerNetworkType) {
      case BillerNetworkTypeCodes.RPPS:
        return new RppsBillerProvider();
      default:
        throw new Error(`Unsupported biller network type: ${billerNetworkType}`);
    }
  }
}
