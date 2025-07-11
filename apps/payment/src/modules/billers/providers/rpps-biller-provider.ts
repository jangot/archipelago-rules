import { BillerNetworkType } from '@library/entity/enum/biller-network.type';
import { ProcessBillersResult } from '../interfaces/billers-provider.interface';
import { RppsFileProcessor } from '../processors/rpps/rpps-file.processor';
import { BaseBillerProvider } from './base-biller-provider';

export class RppsBillerProvider extends BaseBillerProvider {
  private readonly rppsFileProcessor: RppsFileProcessor;

  constructor() {
    super();
    this.rppsFileProcessor = new RppsFileProcessor();
  }

  /**
   * Processes billers for the RPPS network.
   * @param billerNetworkType The type of biller network
   * @param path The path to the file or resource for the billers
   * @returns ProcessBillersResult
   */
  public async processBillers(billerNetworkType: BillerNetworkType, path: string): Promise<ProcessBillersResult> {
    try {
      const processedCount = await this.rppsFileProcessor.processFile('');
      
      // TODO: Save parsed data to DB
      return { processedCount };
    } catch (error) {
      return { processedCount: 0, errors: [error.message] };
    }
  }
}
