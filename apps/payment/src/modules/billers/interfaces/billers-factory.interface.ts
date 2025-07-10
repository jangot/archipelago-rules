import { BillerNetworkType } from '@library/entity/enum/biller-network.type';
import { IBillerProvider } from './billers-provider.interface';

export interface IBillersFactory {
  /**
   * Gets the appropriate biller provider for a specific network type
   * @param billerNetworkType The type of biller network
   * @returns The appropriate biller provider for the specified biller network type
   */
  getFactory(billerNetworkType: BillerNetworkType): IBillerProvider;
}

export const IBillersFactory = Symbol('IBillersFactory');
