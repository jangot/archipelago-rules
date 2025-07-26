import { IFileStorageService } from '@library/shared/common/helper/ifile-storage.service';
import { Readable } from 'stream';
import { ProcessBillersResult } from '../interfaces/billers-provider.interface';
import { BillerFileInfo, RppsBillerSplitter } from '../processors/rpps-biller-splitter';
import { RppsFileProcessor } from '@payment/modules/billers/processors';
import { BillerRepository } from '../repositories/biller.repository';
import { BaseBillerProvider } from './base-biller-provider';

/**
 * RppsBillerProvider orchestrates the full RPPS biller processing workflow.
 */
export class RppsBillerProvider extends BaseBillerProvider {
  constructor(
    private readonly fileStorage: IFileStorageService,
    private readonly rppsFileProcessor: RppsFileProcessor,
    private readonly rppsBillerSplitter: RppsBillerSplitter,
    private readonly billerRepository: BillerRepository,
  ) {
    super();
  }

  /**
   * Processes billers for the RPPS network.
   * @param resource The resource identifier (file path, S3 key, etc)
   * @param outputBasePath The base path for output files
   * @returns ProcessBillersResult
   */
  public async processBillers(
    resource: string,
    outputBasePath: string
  ): Promise<ProcessBillersResult> {
    let processed = 0;
    const updated = 0;
    const skipped = 0;
    const errors: string[] = [];
    try {
      const fileStream: Readable = await this.fileStorage.readStream(resource);
      // Step 1: Parse TXT to JSONÏ
      const jsonFilePath = await this.rppsFileProcessor.parseBillersFile(fileStream, outputBasePath, this.fileStorage);
      // Step 2: Split JSON file into per-biller files
      const billerFiles: BillerFileInfo[] = await this.rppsBillerSplitter.splitJsonFileByBiller(jsonFilePath, outputBasePath, this.fileStorage);
      processed = billerFiles.length;
      // Step 3: For each biller file, calculate CRC32 and update DB if needed
      // TODO Add logic to calculate CRC32 and update DB
      return { processedCount: processed, errors };
    } catch (error) {
      errors.push(error.message);
      return { processedCount: processed, errors };
    }
  }
}
