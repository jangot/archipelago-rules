import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { IBillerProvider } from '../interfaces/billers-provider.interface';

@Injectable()
export abstract class BaseBillerProvider implements IBillerProvider {
  protected readonly logger: Logger = new Logger(BaseBillerProvider.name);
  protected readonly localBucketPath: string = path.resolve(__dirname, '../local-bucket');
  constructor() {}

  /**
   * Moves a file from the source path to the simulated S3 bucket folder.
   * @param sourcePath The path to the source file
   * @returns The destination path in the local bucket
   */
  public async moveFileToLocalBucket(sourcePath: string): Promise<string> {
    await fs.mkdir(this.localBucketPath, { recursive: true });
    const fileName = path.basename(sourcePath);
    const destPath = path.join(this.localBucketPath, fileName);
    await fs.copyFile(sourcePath, destPath);
    await fs.unlink(sourcePath);
    this.logger.log(`Moved file from ${sourcePath} to ${destPath}`);
    return destPath;
  }
}
