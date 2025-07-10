import { BillerNetworkType, BillerNetworkTypeCodes } from '@library/entity/enum/biller-network.type';
import { Injectable, Logger } from '@nestjs/common';
import { IBillersFactory } from './interfaces/billers-factory.interface';

@Injectable()

export class BillersFactory implements IBillersFactory {
  private readonly logger: Logger = new Logger(BillersFactory.name);

  constructor(private readonly rppsProvider: RppsProvider) { }
  

  public getFactory(billerNetworkType: BillerNetworkType): IBillersFactory {
    switch (billerNetworkType) {
      case BillerNetworkTypeCodes.RPPS:
        return this.rppsProvider;
      default:
        throw new Error(`Unsupported biller network type: ${billerNetworkType}`);
    }
  }
}
