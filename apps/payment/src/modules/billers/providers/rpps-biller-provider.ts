import { BillerNetworkType } from '@library/entity/enum/biller-network.type';
import { Readable } from 'stream';
import { ProcessBillersResult } from '../interfaces/billers-provider.interface';
import { FileOriginType } from '../interfaces/file-origin-type.enum';
import { FileSource } from '../interfaces/file-source.interface';
import { RppsFileProcessor } from '../processors/rpps/rpps-file.processor';
import { BaseBillerProvider } from './base-biller-provider';

export class RppsBillerProvider extends BaseBillerProvider {
  private readonly rppsFileProcessor: RppsFileProcessor;
  private readonly fileSource: FileSource;

  constructor(fileSource: FileSource) {
    super();
    this.rppsFileProcessor = new RppsFileProcessor();
    this.fileSource = fileSource;
  }

  /**
   * Processes billers for the RPPS network.
   * @param billerNetworkType The type of biller network
   * @param resource The resource identifier (file path, S3 key, etc)
   * @param fileOrigin The origin of the file
   * @returns ProcessBillersResult
   */
  public async processBillers(billerNetworkType: BillerNetworkType, resource: string, fileOrigin: FileOriginType): Promise<ProcessBillersResult> {
    try {
      const fileStream: Readable = await this.fileSource.getFileStream(resource);
      const processedCount = await this.rppsFileProcessor.processFile(fileStream);
      // TODO: Save parsed data to DB
      return { processedCount };
    } catch (error) {
      return { processedCount: 0, errors: [error.message] };
    }
  }
}
