import { BillerNetworkType } from '@library/entity/enum/biller-network.type';

export interface ProcessBillersResult {
  processedCount: number;
  errors?: string[];
}

export interface IBillerProvider {
  /**
   * Processes billers for a specific network type
   * @param billerNetworkType The type of biller network
   * @param path The path to the file or resource for the billers
   * @returns Promise<ProcessBillersResult>
   */
  processBillers(billerNetworkType: BillerNetworkType, path: string): Promise<ProcessBillersResult>;
}
