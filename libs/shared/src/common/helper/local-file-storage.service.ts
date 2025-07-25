import { Injectable } from '@nestjs/common';
import { createReadStream, createWriteStream, promises as fsPromises } from 'fs';
import { dirname } from 'path';
import { Readable } from 'stream';
import { IFileStorageService } from './ifile-storage.service';

/**
 * Local file storage service using Node.js fs module.
 */
@Injectable()
export class LocalFileStorageService implements IFileStorageService {
  /**
   * Writes a stream to a local file.
   */
  public async writeStream(path: string, stream: Readable): Promise<void> {
    await this.ensureDir(dirname(path));
    const writeStream = createWriteStream(path);
    await new Promise<void>((resolve, reject) => {
      stream.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      stream.on('error', reject);
    });
  }

  /**
   * Reads a local file as a stream.
   */
  public async readStream(path: string): Promise<Readable> {
    return createReadStream(path);
  }

  /**
   * Checks if a file or directory exists.
   */
  public async exists(path: string): Promise<boolean> {
    try {
      await fsPromises.access(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Lists files in a directory.
   */
  public async listFiles(path: string): Promise<string[]> {
    return fsPromises.readdir(path);
  }

  /**
   * Ensures a directory exists, creates it if not.
   */
  public async ensureDir(path: string): Promise<void> {
    await fsPromises.mkdir(path, { recursive: true });
  }
} 
