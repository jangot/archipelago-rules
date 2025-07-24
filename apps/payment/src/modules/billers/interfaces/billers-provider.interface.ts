import { BillerNetworkType } from '@library/entity/enum/biller-network.type';
import { FileOriginType } from './file-origin-type.enum';

export interface ProcessBillersResult {
  processedCount: number;
  errors?: string[];
}

export interface IBillerProvider {
  /**
   * Processes billers for a specific network type
   * @param billerNetworkType The type of biller network
   * @param resource The resource identifier (file path, S3 key, etc)
   * @param fileOrigin The origin of the file
   * @returns Promise<ProcessBillersResult>
   */
  processBillers(
    billerNetworkType: BillerNetworkType,
    resource: string,
    fileOrigin: FileOriginType
  ): Promise<ProcessBillersResult>;
}
