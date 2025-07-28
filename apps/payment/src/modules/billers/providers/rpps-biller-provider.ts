import { IFileStorageProvider } from '@library/shared/common/providers/ifile-storage.provider';
import { RppsFileProcessor } from '@payment/modules/billers/processors';
import { Readable } from 'stream';
import { ProcessBillersResult } from '../interfaces/billers-provider.interface';
import { RppsBillerSplitter } from '../processors/rpps-biller-splitter';
import { BillerRepository } from '../repositories/biller.repository';
import { BaseBillerProvider } from './base-biller-provider';

/**
 * RppsBillerProvider orchestrates the full RPPS biller processing workflow.
 */
export class RppsBillerProvider extends BaseBillerProvider {
  constructor(
    private readonly fileStorage: IFileStorageProvider,
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
    const processed = 0;
    const updated = 0;
    const skipped = 0;
    const errors: string[] = [];
    let fileStream: Readable | null = null;
    let jsonFilePath: string | null = null;
    let billerFilesFolder: string | null = null;

    try {
      // Essential security validation - minimal but critical
      if (!resource || typeof resource !== 'string') {
        this.logger.error('Invalid resource parameter');
        return { processedCount: 0, errors: ['Invalid resource parameter'] };
      }

      // Path traversal protection - critical security
      if (resource.includes('..') || resource.includes('//')) {
        this.logger.error('Invalid resource path: contains path traversal characters');
        return { processedCount: 0, errors: ['Invalid resource path'] };
      }

      if (!(await this.fileStorage.exists(resource))) {
        this.logger.error(`${resource} does not exist`);
        return { processedCount: processed, errors };
      }
      this.logger.log(`Starting biller processing for resource: ${resource}`);
      
      // Step 1: Read the input file stream
      fileStream = await this.fileStorage.readStream(resource);
      
      // Step 2: Parse TXT to JSON
      jsonFilePath = await this.rppsFileProcessor.parseBillersFile(fileStream, outputBasePath, this.fileStorage);
      this.logger.log(`Successfully parsed TXT to JSON: ${jsonFilePath}`);
      
      // Step 3: Split JSON file into per-biller files
      billerFilesFolder = await this.rppsBillerSplitter.splitJsonFileByBiller(jsonFilePath, outputBasePath, this.fileStorage);
      this.logger.log(`Successfully split JSON into biller files: ${billerFilesFolder}`);
      
      // Step 4: For each biller file, calculate CRC32 and update DB if needed
      // TODO Add logic to calculate CRC32 and update DB
      // This would involve:
      // - Reading each biller file from billerFilesFolder
      // - Calculating CRC32 checksum
      // - Comparing with existing biller in DB
      // - Updating if different
      
      this.logger.log(`Biller processing completed successfully. Processed: ${processed}, Updated: ${updated}, Skipped: ${skipped}`);
      return { processedCount: processed, errors };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const fullErrorMessage = `Biller processing failed: ${errorMessage}`;
      errors.push(fullErrorMessage);
      
      this.logger.error('Biller processing failed', {
        resource,
        outputBasePath,
        jsonFilePath,
        billerFilesFolder,
        error: error instanceof Error ? error.stack : error,
      });
      
      return { processedCount: processed, errors };
    } finally {
      // Clean up resources
      if (fileStream) {
        fileStream.destroy();
        this.logger.debug('File stream destroyed');
      }
      
      // Optionally clean up temporary files if processing failed
      if (errors.length > 0) {
        try {
          if (jsonFilePath && await this.fileStorage.exists(jsonFilePath)) {
            // In a production we might want to keep temporary files for debugging. If not needed just remove it.
            // await this.fileStorage.delete(jsonFilePath);
            this.logger.debug(`Temporary JSON file preserved for debugging: ${jsonFilePath}`);
          }
        } catch (cleanupError) {
          this.logger.warn('Failed to cleanup temporary files', { error: cleanupError });
        }
      }
    }
  }
}
