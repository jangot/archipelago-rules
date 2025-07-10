import { BillerNetworkType, BillerNetworkTypeCodes } from '@library/entity/enum/biller-network.type';
import { Injectable, Logger } from '@nestjs/common';
import { IBillersFactory } from './interfaces/billers-factory.interface';
import { IBillerProvider } from './interfaces/billers-provider.interface';
import { RppsBillerProvider } from './providers/rpps-biller-provider';

@Injectable()
export class BillersFactory implements IBillersFactory {
  private readonly logger: Logger = new Logger(BillersFactory.name);

  constructor(private readonly rppsProvider: RppsBillerProvider) { }

  /**
   * Gets the appropriate biller provider for a specific network type
   * @param billerNetworkType The type of biller network
   * @returns The appropriate biller provider for the specified biller network type
   */
  public getFactory(billerNetworkType: BillerNetworkType): IBillerProvider {
    switch (billerNetworkType) {
      case BillerNetworkTypeCodes.RPPS:
        return this.rppsProvider;
      default:
        throw new Error(`Unsupported biller network type: ${billerNetworkType}`);
    }
  }
}
