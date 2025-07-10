import { BillerNetworkType } from '@library/entity/enum/biller-network.type';


export interface IBillersFactory {
  /**
   * Gets the appropriate loan payment manager for a specific payment type
   * @param billerNetworkType The type of biller network
   * @returns The appropriate biller factory for the specified biller network type
   */
  getFactory(billerNetworkType: BillerNetworkType): IBillersFactory;
}

export const IBillersFactory = Symbol('IBillersFactory');
