import { BillerNetworkType } from '@library/entity/enum/biller-network.type';

export interface IBillerProvider {
  /**
   * Processes a biller file for a specific network type
   * @param billerNetworkType The type of biller network
   * @param filePath The path to the file to be used for the biller
   * @returns Promise<void>
   */
  processBillerFile(billerNetworkType: BillerNetworkType, filePath: string): Promise<void>;
}
