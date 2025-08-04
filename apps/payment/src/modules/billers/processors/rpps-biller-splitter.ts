import { IFileStorageProvider } from '@library/shared/common/providers/ifile-storage.provider';
import { Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import { Readable } from 'stream';
import { parser as jsonParser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';

export interface BillerFileInfo {
  billerId: string;
  filePath: string;
}

/**
 * RppsBillerSplitter splits a JSON file into per-biller files and returns their info.
 */
@Injectable()
export class RppsBillerSplitter {
  private readonly logger: Logger = new Logger(RppsBillerSplitter.name);
  private readonly maxConcurrency = 5; // Reduced concurrency to prevent file system overload
  private readonly batchSize = 100; // Process billers in batches
  private readonly maxBillerSize = 7 * 1024 * 1024; // 7MB limit per biller since there are some large billers.
  /**
   * Splits the JSON file by biller, writes each as a JSON file.
   * This method is optimized for large datasets and doesn't track file info in memory.
   * @param jsonFilePath The path to the JSON file
   * @param outputBasePath The base path for output folders
   * @param fileStorage The file storage service to use
   * @returns The output folder path where files were written
   */
  public async splitJsonFileByBiller(jsonFilePath: string, outputBasePath: string, fileStorage: IFileStorageProvider): Promise<string> {
    // Determine output folder name (date + increment)
    const today = new Date();
    const logInterval = 1000;
    const dateStr = today.toISOString().slice(0, 10);
    let folderSuffix = 0;
    let folderName = `${dateStr}-${folderSuffix}`;
    while (await fileStorage.exists(join(outputBasePath, folderName))) {
      folderSuffix++;
      folderName = `${dateStr}-${folderSuffix}`;
    }
    const outputFolder = join(outputBasePath, folderName);
    await fileStorage.ensureDir(outputFolder);

    this.logger.log(`Starting to split JSON file into biller files in folder: ${outputFolder}`);

    // Stream the JSON file and split by biller
    const readStream = await fileStorage.getReadStream(jsonFilePath);
    const pipeline = readStream.pipe(jsonParser()).pipe(streamArray());

    // Add error handling for the pipeline
    pipeline.on('error', (error) => {
      this.logger.error('Pipeline error:', error);
      throw error;
    });

    const writeQueue: Array<{ billerId: string; billerData: any; filePath: string }> = [];
    let processed = 0;
    let failed = 0;
    let written = 0;
    const fileLocks = new Set<string>(); // Track files being written to prevent race conditions

    try {
      // Process stream using async iteration for better control
      for await (const data of pipeline) {
        try {
          const biller = data.value;
          
          // Validate biller data
          if (!this.isValidBiller(biller)) {
            this.logger.warn(`Invalid biller data at index ${processed}, skipping`);
            failed++;
            continue;
          }

          // Validate and sanitize biller ID for safe filename creation
          let billerId = biller.billerId;
          if (!billerId || typeof billerId !== 'string') {
            billerId = `biller_${processed + 1}`;
          } else {
            // Sanitize biller ID for safe filename
            billerId = billerId.replace(/[^a-zA-Z0-9_-]/g, '_');
            if (billerId.length > 50) {
              billerId = billerId.substring(0, 50);
            }
          }

          const billerFileName = `${billerId}.json`;
          const billerFilePath = join(outputFolder, billerFileName);

          // Check if file is currently being written to prevent race conditions
          if (fileLocks.has(billerFilePath)) {
            this.logger.warn(`File ${billerFilePath} is currently being written, skipping duplicate`);
            failed++;
            continue;
          }

          // Add to write queue
          writeQueue.push({ billerId, billerData: biller, filePath: billerFilePath });
          processed++;
          
          // Log progress every 1000 billers 
          if (processed % logInterval === 0) {
            this.logger.log(`Processed ${processed} billers, ${written} files written, ${failed} failed`);
          }

          // Process queue when batch size is reached
          if (writeQueue.length >= this.batchSize) {
            await this.processWriteQueue(writeQueue, fileStorage, fileLocks);
            written += writeQueue.length;
            writeQueue.length = 0; // Clear the queue
          }
        } catch (error) {
          this.logger.error(`Error processing biller at index ${processed}: ${error.message}`);
          failed++;
        }
      }

      // Process remaining items in queue
      if (writeQueue.length > 0) {
        await this.processWriteQueue(writeQueue, fileStorage, fileLocks);
        written += writeQueue.length;
      }
    } finally {
      // Clean up file locks to prevent memory leaks
      fileLocks.clear();
    }

    this.logger.log(`Completed splitting JSON file. Processed: ${processed}, Written: ${written}, Failed: ${failed}`);
    
    return outputFolder;
  }

  /**
   * Processes the write queue with concurrency control and file locking
   * @param queue The queue of biller data to write
   * @param fileStorage The file storage service
   * @param fileLocks Set of file paths currently being written
   */
  private async processWriteQueue(
    queue: Array<{ billerId: string; billerData: any; filePath: string }>,
    fileStorage: IFileStorageProvider,
    fileLocks: Set<string>
  ): Promise<void> {
    // Process in batches to control concurrency
    for (let i = 0; i < queue.length; i += this.maxConcurrency) {
      const batch = queue.slice(i, i + this.maxConcurrency);
      
      const writePromises = batch.map(async ({ billerData, filePath }) => {
        // Use atomic operation to acquire file lock
        let lockAcquired = false;
        try {
          // Atomic check and add operation to prevent race conditions
          if (fileLocks.has(filePath)) {
            this.logger.error(`File ${filePath} is already being written`);
            return; // Skip this file instead of throwing
          }
          
          // Add to locks set atomically
          fileLocks.add(filePath);
          lockAcquired = true;
          
          // Create stream from JSON string
          const jsonString = JSON.stringify(billerData, null, 2);
          const jsonStream = Readable.from([jsonString]);
          
          await fileStorage.writeStream(filePath, jsonStream);
          // Removed debug log for every file write - too verbose for large datasets
        } catch (error) {
          this.logger.error(`Failed to write biller file ${filePath}: ${error.message}`);
          // Don't throw error - let the batch continue with other files
        } finally {
          // Release file lock only if it was acquired
          if (lockAcquired) {
            fileLocks.delete(filePath);
          }
        }
      });

      // Wait for all writes in this batch to complete
      await Promise.allSettled(writePromises);
    }
  }

  /**
   * Validates biller data structure
   * @param biller The biller object to validate
   * @returns True if valid, false otherwise
   */
  private isValidBiller(biller: any): boolean {
    // Basic structure validation
    if (!biller || typeof biller !== 'object') {
      this.logger.warn('Invalid biller: not an object');
      return false;
    }

    // Check for circular references and excessive nesting
    try {
      JSON.stringify(biller);
    } catch {
      this.logger.warn('Invalid biller: cannot be serialized');
      return false;
    }

    // Essential size validation - prevent memory attacks
    const billerSize = JSON.stringify(biller).length;
    if (billerSize > this.maxBillerSize) {
      this.logger.warn(`Invalid biller: size ${billerSize} exceeds limit ${this.maxBillerSize}`);
      return false;
    }

    // Basic required field validation
    if (!biller.recordType || typeof biller.recordType !== 'string') {
      this.logger.warn('Invalid biller: missing or invalid recordType');
      return false;
    }

    return true;
  }
} 
