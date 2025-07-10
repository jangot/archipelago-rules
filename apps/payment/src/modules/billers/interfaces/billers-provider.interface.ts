import { BillerNetworkType } from '@library/entity/enum/biller-network.type';

export interface IBillerProvider {
  /**
   * Aquires a biller for a specific network type
   * @param billerNetworkType The type of biller network
   * @param filePath The path to the file to be used for the biller
   * @returns The biller or null if no biller was found
   */
  acquire(billerNetworkType: BillerNetworkType, filePath: string):void;
  
}
