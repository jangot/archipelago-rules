import { BillerNetworkType } from '@library/entity/enum/biller-network.type';
import { RppsFileProcessor } from '../processors/rpps-file.processor';
import { BaseBillerProvider } from './base-biller-provider';

export class RppsBillerProvider extends BaseBillerProvider {
  private readonly rppsFileProcessor: RppsFileProcessor;

  constructor() {
    super();
    this.rppsFileProcessor = new RppsFileProcessor();
  }

  /**
   * Processes a biller file for the RPPS network.
   * @param billerNetworkType The type of biller network
   * @param filePath The path to the file to be used for the biller
   */
  public async processBillerFile(billerNetworkType: BillerNetworkType, filePath: string): Promise<void> {
    const localPath = await this.moveFileToLocalBucket(filePath);
    await this.rppsFileProcessor.processFile(localPath);
    // TODO: Save parsed data to DB
  }
}
