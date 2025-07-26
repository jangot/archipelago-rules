import { IFileStorageService } from '@library/shared/common/helper/ifile-storage.service';
import { Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import { PassThrough } from 'stream';
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

  /**
   * Splits the JSON file by biller, writes each as a JSON file, and returns their info.
   * @param jsonFilePath The path to the JSON file
   * @param outputBasePath The base path for output folders
   * @param fileStorage The file storage service to use
   * @returns Array of biller file info
   */
  public async splitJsonFileByBiller(jsonFilePath: string, outputBasePath: string, fileStorage: IFileStorageService): Promise<BillerFileInfo[]> {
    // Determine output folder name (date + increment)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    let folderSuffix = 0;
    let folderName = `${dateStr}-${folderSuffix}`;
    while (await fileStorage.exists(join(outputBasePath, folderName))) {
      folderSuffix++;
      folderName = `${dateStr}-${folderSuffix}`;
    }
    const outputFolder = join(outputBasePath, folderName);
    await fileStorage.ensureDir(outputFolder);

    // Stream the JSON file and split by biller
    const readStream = await fileStorage.readStream(jsonFilePath);
    const pipeline = readStream.pipe(jsonParser()).pipe(streamArray());

    const billerFiles: BillerFileInfo[] = [];
    const promises: Promise<void>[] = [];
    let processed = 0;

    pipeline.on('data', (data: any) => {
      const biller = data.value;
      const billerId = biller.billerId || `biller_${processed + 1}`;
      const billerFileName = `${billerId}.json`;
      const billerFilePath = join(outputFolder, billerFileName);
      const billerJson = JSON.stringify(biller);
      const jsonStream = new PassThrough();
      jsonStream.end(Buffer.from(billerJson, 'utf-8'));
      const writeFile = async () => {
        await fileStorage.writeStream(billerFilePath, jsonStream);
        billerFiles.push({ billerId, filePath: billerFilePath });
      };
      promises.push(writeFile());
      processed++;
    });

    return new Promise((resolve, reject) => {
      pipeline.on('end', async () => {
        await Promise.all(promises);
        resolve(billerFiles);
      });
      pipeline.on('error', (err: any) => {
        reject(err);
      });
    });
  }
} 
